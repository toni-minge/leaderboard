import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import IpfsMini from 'ipfs-mini';
import abi from '../contract/abi.json'
import { ethers } from 'ethers';
import { Table, Pagination } from "antd";

const RankingList = () => {
  // Define state variables to store the ranking list and events
  const [rankingList, setRankingList] = useState([]);
  const [events, setEvents] = useState([]);

  const [columns] = useState([
    {
        title: "Rank",
        dataIndex: "rank",
        key: "rank"
    },
    {
        title: "Image",
        dataIndex: "image",
        key: "image",
        render: (image) => <Image url={image} />
    },
    {
        title: "Wallet Address",
        dataIndex: "wallet",
        key: "wallet",
        render: (wallet) => `${wallet.substring(0, 3)}...${wallet.substring(wallet.length - 3)}`
    },
    {
        title: "Donation Amount",
        dataIndex: "amount",
        key: "amount",
        render: (donation) => `ETH ${ethers.utils.formatEther(donation)}`
    }
  ]);

  // Define a function to fetch the NFT data and create a ranking list
  const fetchRankingList = async () => {
    // Create a new instance of the Web3 and IPFS mini libraries
    const web3 = new Web3("https://goerli.infura.io/v3/17589db698854cfa97baa16e2d7ed965");

    // Create an instance of the contract
    const contract = new web3.eth.Contract(abi, '0xa8493288e3642e7bf36652d458b5E80Ab1A123f9');

    // Call the getAllNFTs function in the contract to get the NFT data
    var nfts = await contract.methods.getAllNFTs().call();

    console.log(nfts)

    const rankingList =
      nfts.map((nft, i) => ({
        image: nft[2],
        wallet: nft[0],
        amount: nft[1]
      }))

    // Sort the NFTs by their donation amount in descending order
    rankingList.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
    const d = rankingList.map((n, i) => ({...n, rank: i + 1}))

    console.log(d)

    // Update the ranking list in state
    setRankingList(d);
  };

  // Use the useEffect hook to fetch the data on component mount
  useEffect(() => {
    fetchRankingList();
  }, []);

  // Define a function to listen for events from the contract
  const listenForEvents = async () => {
    // Create a new instance of the Web3 library
    const web3 = new Web3("https://goerli.infura.io/v3/17589db698854cfa97baa16e2d7ed965");

    // Create an instance of the contract
    const contract = new web3.eth.Contract(abi, '0xa8493288e3642e7bf36652d458b5E80Ab1A123f9');

    // Listen for the Mint event and update the events in state when it is emitted
    contract.events.Mint({}, (error, event) => {
      console.log(event)

      if (error) {
        // Handle error
        return;
      }
      setEvents([...events, event]);
    });
  };

  // Use the useEffect hook to listen for events from the contract
  useEffect(() => {
    listenForEvents();
  }, []);



  return (
    <div>
        <Table dataSource={rankingList} columns={columns} />
    </div>
    // <ol>
    //   leaderbord
    //   {rankingList.map(nft => (
    //     <li key={nft.tokenId}>
    //       {`${nft.owner.substring(0, 3)}...${nft.owner.substring(nft.owner.length - 3)}`}: {ethers.utils.formatEther(nft.donation) }
    //       <Image nft={nft} />
    //     </li>
    //   ))}
    // </ol>
  );
}

export default RankingList;


const Image = ({url}) => {
  const [string, setString] = useState('')

  const getString = async (url) => {
    try {
      const data = await fetch(url)
      const string = await data.text()
      setString(string)
    } catch(err){
      console.log(err)
    }
  }

  useEffect(() => { getString(url)}, [])

  return (
    <img style={{maxWidth: '200px'}} src={string} />
  )
}
