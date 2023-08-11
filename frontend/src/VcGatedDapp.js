import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Spinner,
  Card,
  Center,
  VStack,
} from "@chakra-ui/react";

import { usePublicClient, useWalletClient } from "wagmi";

import { getAccount, waitForTransaction } from "@wagmi/core";
import demoAbi from "./demoSmartContract/demoAbi.json";

function VcGatedDapp() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [connectedAddress, setConnectedAddress] = useState();
  const [addressIsConnected, setAddressIsConnected] = useState(false);
  const [currentBlockNumber, setCurrentBlockNumber] = useState();
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  // variables specific to demo https://mumbai.polygonscan.com/address/0xa003003c47fb65291cb0b079cbd6028a7af60fa2#code
  const mySmartContractAddress = "0xA003003C47fb65291CB0B079CBd6028a7aF60Fa2";

  const contractConfig = {
    address: mySmartContractAddress,
    abi: demoAbi,
  };

  const [count, setCount] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // interval check whether user has connected or disconnected wallet
    const interval = setInterval(() => {
      const { address, isConnected } = getAccount();
      setConnectedAddress(address);
      setAddressIsConnected(isConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (publicClient) {
      const readCount = async () => {
        await readCounterValue();
      };
      const checkCurrentBlockNumber = async () => {
        const blockNumber = await publicClient.getBlockNumber();
        setCurrentBlockNumber(blockNumber);
      };

      readCount();
      checkCurrentBlockNumber();
    }
  }, [publicClient]);

  async function readCounterValue() {
    if (publicClient) {
      try {
        const data = await publicClient.readContract({
          ...contractConfig,
          functionName: "retrieve",
        });
        const newCount = JSON.parse(data);
        setCount(newCount);
        return newCount;
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }

  const incrementCounter = async () => {
    if (addressIsConnected) {
      try {
        const { request } = await publicClient.simulateContract({
          ...contractConfig,
          account: connectedAddress,
          functionName: "increment",
        });
        const { hash } = await walletClient.writeContract(request);
        setIsLoading(true);
        await waitForTransaction({
          hash,
        });
      } catch (err) {
        console.log("Error: ", err);
      }

      await readCounterValue();
      setIsLoading(false);
    } else {
      alert("Connect wallet to update blockchain data");
    }
  };

  return (
    <div id="vc-gated-dapp">
      <Box background="black" color="white" py={4}>
        <Container maxW={"80%"}>
          <Flex justifyContent="space-between">
            <Heading>My VC Gated Dapp</Heading>
            <ConnectButton showBalance={false} />
          </Flex>
        </Container>
      </Box>

      <Box>
        <Container maxW={"80%"} py={4}>
          <Button onClick={() => setShowConnectionInfo(!showConnectionInfo)}>
            {showConnectionInfo ? "Hide" : "Show"} connection information
          </Button>
          {showConnectionInfo && (
            <Box py={4}>
              {addressIsConnected ? (
                <p>Address {connectedAddress} is connected to this dapp</p>
              ) : (
                <p>
                  No account connected. Connect wallet to interact with dapp
                </p>
              )}

              {publicClient ? (
                <ul>
                  <li>
                    Currently using a{" "}
                    <a
                      href="https://viem.sh/docs/clients/public.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      public client
                    </a>{" "}
                    with Chain: {publicClient?.chain?.name} and Chain ID:{" "}
                    {publicClient?.chain?.id}
                  </li>

                  <li>
                    The current block number is {currentBlockNumber?.toString()}
                  </li>
                </ul>
              ) : (
                <>
                  Please install{" "}
                  <a
                    href="https://metamask.io/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Metamask
                  </a>
                </>
              )}
            </Box>
          )}
          <div>
            <Card my={4} p={4}>
              <Center>
                <VStack>
                  <Heading>Counter Dapp</Heading>

                  <p>The current count is</p>
                  <Heading>{isLoading ? <Spinner></Spinner> : count}</Heading>
                  <Button onClick={() => incrementCounter()}>
                    Increment counter
                  </Button>
                </VStack>
              </Center>
            </Card>
            <ul>
              <li>
                Check out the Counter{" "}
                <a
                  href={`https://mumbai.polygonscan.com/address/${mySmartContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  contract on Polygonscan
                </a>{" "}
                and the{" "}
                <a
                  href="https://github.com/oceans404/gasless-vc-gated-dapp/blob/main/frontend/src/demoSmartContract/Counter.sol"
                  target="_blank"
                  rel="noreferrer"
                >
                  {" "}
                  contract code on Github
                </a>
              </li>
              <li>
                You need Polygon Mumbai Matic to update the counter value. Use
                the{" "}
                <a
                  href="https://mumbaifaucet.com/?r=zU2MTQwNTU5Mzc2M"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mumbai Faucet
                </a>{" "}
                to get Mumbai Matic.
              </li>
            </ul>
          </div>
        </Container>
      </Box>
    </div>
  );
}

export default VcGatedDapp;
