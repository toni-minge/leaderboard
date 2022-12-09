// Import the required libraries and components
import React, { useState } from "react";
import Webcam from 'react-webcam';
import { ethers } from 'ethers';
import Web3 from "web3";
import { Button, Form, Input, message, Modal, Upload, Spin } from "antd";
import abi from '../contract/abi.json'

// Set the provider for the Web3 library
const web3 = new Web3("https://goerli.infura.io/v3/17589db698854cfa97baa16e2d7ed965");

import { create } from "ipfs-http-client";


const projectId = '2IdoBfPRiI27VFVDgcefNxYCuNH'; //REPLACE  LATER
const projectSecret = '58e486612f47ad2c4b8c2b9061bbe368'; //REPLACE LATER
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

// Set the ABI and address of the DonateNFT contract
const contractABI = abi
const contractAddress = "0xa8493288e3642e7bf36652d458b5E80Ab1A123f9";

const MintingComponent = () => {
  // Set up the webcamRef to access the webcam
  const webcamRef = React.useRef(null);
  const [loading, setLoading] = useState(false)

  // Set up the capturedImage state to store the captured image
  const [capturedImage, setCapturedImage] = useState(null);

  // Set up the modalVisible state to control the visibility of the Modal
  const [modalVisible, setModalVisible] = useState(false);

  const [donation, setDonation] = useState("0");
  const [ipfsHash, setIpfsHash] = useState("");
  const [contract, setContract] = useState(null)

  const [urlArr, setUrlArr] = useState([]);
  const [wallet, setWallet] = useState(null)

  // Function to capture an image from the webcam
  const capture = React.useCallback(
    () => {
      // Check if the webcamRef object is set up and initialized
      if (webcamRef && webcamRef.current) {
        // Use the webcamRef object to capture the image from the webcam
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setModalVisible(true);
      }
    },
    [webcamRef]
  );

  // Convert an image to an IPFS hash
  const convertToIpfsHash = async (file) => {
    const subdomain = 'https://lead.infura-ipfs.io';

    try {
        const added = await client.add({ content: file });
        const URL = `${subdomain}/ipfs/${added.path}`;

        setIpfsHash(URL)
        return URL;
       } catch (error) {
         console.log(error.message);
     }
  };

  const initializeMetaMask = async () => {
  // Check if MetaMask is installed and enabled
    if (typeof window.ethereum === 'undefined') {
      message.error('Please install and enable MetaMask to continue.');
      return;
    }

    // Request access to user accounts
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      message.error('You need to grant access to your Ethereum accounts in order to continue.');
      return;
    }

    // Initialize Web3 provider
    const web3 = new Web3(window.ethereum);

    const _contract = new web3.eth.Contract(contractABI, contractAddress);
    setContract(_contract)

    // Set default account
    const accounts = await web3.eth.getAccounts();
    console.log(accounts)
    setWallet(accounts[0])

    return web3;
  }

  const retake = () => {
    setCapturedImage(null);
  }

  const mint = async () => {
    // Validate the NFT token ID and donation amount
    if (capturedImage == null || donation <= 0) {
        // Show an error message
        message.error("Invalid token ID or donation amount!");
        return;
    }

    const hash = await convertToIpfsHash(capturedImage)

    if (hash === "") {
        // Show an error message
        message.error("Something went wrong");
        setModalVisible(false)
        setCapturedImage(null);
        setDonation(0);
        return;
    }

    // Call "mint" function
    const tx = contract.methods.mint(hash).send({
      from: wallet,
      value: ethers.utils.parseEther(donation),
    });

    setLoading(true)
    await tx

    setModalVisible(false)
    setCapturedImage(null);
    setDonation(0);

    // Set the loading state
    setLoading(false);
  }

  const address_shortened = wallet && `${wallet.substring(0, 3)}...${wallet.substring(wallet.length - 3)}`

  return (
    <div>
      <Button onClick={initializeMetaMask}>{!wallet ? "connect wallet" : address_shortened}</Button>
      {/* Show the webcam signal using the Webcam component */}
     {!capturedImage ?
       <Webcam
         ref={webcamRef}
         width={400}
         height={300}
         screenshotFormat="image/jpeg"
         /> :
         <img src={capturedImage} alt="Captured image" />}

      {/* Button to capture an image from the webcam */}

      {!capturedImage ?
        <Button disabled={wallet === null} onClick={capture}>Capture Image</Button> :
        <Button onClick={retake}>Retake</Button> }

      {/* Modal to show the captured image and allow the user to confirm */}
      <Modal
        title="Captured Image"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={loading ? [
            <Spin />,
          ] : [
            <Button key="back" onClick={() => setModalVisible(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={mint}>
              Mint NFT
            </Button>
          ]}
      >
        {/* Show the captured image if it exists in the state */}
        {capturedImage && <img src={capturedImage} alt="Captured image" />}
        <Input type="number" value={donation} onChange={(event) => setDonation(event.target.value)} />
      </Modal>
    </div>
  );
};

export default MintingComponent;
