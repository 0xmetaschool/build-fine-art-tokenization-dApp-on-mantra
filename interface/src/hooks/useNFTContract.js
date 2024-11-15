import { useCallback, useState } from 'react';
import { useAccount, useCosmWasmClient } from "graz";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACT_ADDRESS } from '../chain';
import { GasPrice } from "@cosmjs/stargate";
import { coins } from "@cosmjs/proto-signing";

export function useNftContract() {
  const { data: account } = useAccount();
  const { data: cosmWasmClient } = useCosmWasmClient();
  const [loading, setLoading] = useState(false);

  const getSigningClient = useCallback(async () => {
    if (!window.keplr) throw new Error("Keplr not found");
    await window.keplr.enable("mantra-dukong-1");
    const offlineSigner = window.keplr.getOfflineSigner("mantra-dukong-1");
    const gasPrice = GasPrice.fromString('0.01uom');
    return await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.dukong.mantrachain.io",  
    offlineSigner,
    { gasPrice }
  ); }, []);

  const instantiateContract = useCallback(async (initMsg) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const result = await signingClient.instantiate(
      account.bech32Address,
      initMsg.code_id,
      initMsg,
      "Instantiate NFT Contract",
      "auto"
    );
    setLoading(false);
    return result;
  }, [account, getSigningClient]);

  const queryConfig = useCallback(async (caller = "default") => {
    if (!cosmWasmClient) return null;
    setLoading(true);
    const nftdetails = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, { nft_details: {} });
    const totalminted = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, { num_tokens: {} });
    const data = nftdetails.token_uri;
    const response = await fetch(data);
    const metadata = await response.json();
    const nft = {name: metadata.name, description:metadata.description, image: `https://gateway.pinata.cloud/ipfs/${metadata.image.slice(7)}`, mint_price: ((nftdetails.mint_price.amount)/1000000), max_mint: nftdetails.max_mints, total_minted: totalminted.count}
    if(caller != "mintNFT"){
      setLoading(false);
    }
    console.log(nft);
    return nft;
  }, [cosmWasmClient]);

  const mintNft = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    const nftDetails = await queryConfig("mintNFT");
    if (!nftDetails) {
      setLoading(false);
      throw new Error("Failed to fetch NFT details");
    }
    const mintPrice = nftDetails.mint_price;
    await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { mint: { owner: account.bech32Address, extension: {} } },
      "auto",
      "",
      coins(mintPrice * 1000000, "uom")  
    );
  }, [account, getSigningClient, queryConfig]);

  return { instantiateContract, queryConfig, mintNft, loading, setLoading };
}