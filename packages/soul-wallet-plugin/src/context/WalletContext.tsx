import React, {
    createContext,
    useState,
    useEffect,
    useRef,
    createRef,
} from "react";
import { WalletLib } from "soul-wallet-lib";
import Web3 from "web3";
import api from "@src/lib/api";
import { Utils } from "@src/Utils";
import SignTransaction from "@src/components/SignTransaction";
import config from "@src/config";
import BN from "bignumber.js";
import KeyStore from "@src/lib/keystore";
import EntryPointABI from "../contract/abi/EntryPoint.json";
import browser from "webextension-polyfill";
import { getLocalStorage, setLocalStorage } from "@src/lib/tools";

// init global instances
const keyStore = KeyStore.getInstance();
const web3 = new Web3(config.provider);

interface IWalletContext {
    web3: Web3;
    account: string;
    // eoa, contract
    walletType: string;
    walletAddress: string;
    getWalletAddress: () => Promise<void>;
    getWalletAddressByEmail: (email: string) => Promise<string>;
    getWalletType: () => Promise<void>;
    getEthBalance: () => Promise<string>;
    generateWalletAddress: (val: string) => string;
    getGasPrice: () => Promise<number>;
    activateWallet: () => Promise<void>;
    getAccount: () => Promise<void>;
    signTransaction: (txData: any) => Promise<any>;
    executeOperation: (operation: any, actionName?: string, tabId?: number) => Promise<void>;
    addGuardian: (guardianAddress: string) => Promise<void>;
    removeGuardian: (guardianAddress: string) => Promise<void>;
    getRecoverId: (newOwner: string, walletAddress: string) => Promise<object>;
    recoverWallet: (newOwner: string, signatures: string[]) => Promise<void>;
    deleteWallet: () => Promise<void>;
    sendErc20: (
        tokenAddress: string,
        to: string,
        amount: string,
    ) => Promise<void>;
    sendEth: (to: string, amount: string) => Promise<void>;
    replaceAddress: () => Promise<void>;
}

export const WalletContext = createContext<IWalletContext>({
    web3,
    account: "",
    walletType: "",
    walletAddress: "",
    getWalletAddress: async () => {},
    getWalletAddressByEmail: async () => {
        return "";
    },
    getWalletType: async () => {},
    getAccount: async () => {},
    signTransaction: async () => {},
    executeOperation: async () => {},
    getEthBalance: async () => {
        return "";
    },
    addGuardian: async () => {},
    removeGuardian: async () => {},
    getRecoverId: async () => {
        return {};
    },
    recoverWallet: async () => {},
    generateWalletAddress: () => {
        return "";
    },
    getGasPrice: async () => {
        return 0;
    },
    activateWallet: async () => {},
    deleteWallet: async () => {},
    sendErc20: async () => {},
    sendEth: async () => {},
    replaceAddress: async () => {},
});

export const WalletContextProvider = ({ children }: any) => {
    const [account, setAccount] = useState<string>("");
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [walletType, setWalletType] = useState<string>("");
    const signModal = createRef<any>();

    const getEthBalance = async () => {
        const res = await web3.eth.getBalance(walletAddress);
        return new BN(res).shiftedBy(-18).toString();
    };

    const getGasPrice = async () => {
        const gas = await web3.eth.getGasPrice();
        const gasMultiplied = new BN(gas)
            .times(config.feeMultiplier)
            .integerValue()
            .toNumber();
        console.log("gas mul", gasMultiplied);
        // return Number(gas);
        return 50 * 10 ** 9;
    };

    const getAccount = async () => {
        const res = await keyStore.getAddress();
        setAccount(res);
    };

    const signTransaction = async (txData: any) => {
        return await keyStore.sign(txData);
    };

    const generateWalletAddress = (address: string) => {
        const walletAddress = WalletLib.EIP4337.calculateWalletAddress(
            config.contracts.logic,
            config.contracts.entryPoint,
            address,
            config.contracts.weth,
            config.contracts.paymaster,
            config.defaultSalt,
            config.contracts.create2Factory,
        );

        console.log("generated wallet address", walletAddress);
        return walletAddress;
    };

    const getWalletAddress = async () => {
        const res: any = await api.account.getWalletAddress({
            key: account,
        });
        const walletAddress = res.data.wallet_address;
        // console.log("ready to get", walletAddress);
        await setLocalStorage("activeWalletAddress", walletAddress);

        setWalletAddress(res.data.wallet_address);
    };

    const getWalletAddressByEmail = async (email: string) => {
        const res: any = await api.account.getWalletAddress({
            email,
        });
        const walletAddress = res.data.wallet_address;
        return walletAddress;
    };

    const getWalletType = async () => {
        const contractCode = await web3.eth.getCode(walletAddress);
        setWalletType(contractCode !== "0x" ? "contract" : "eoa");
    };

    const executeOperation = async (
        operation: any,
        // no actionName means no need to sign
        actionName?: string,
        tabId?: number,
    ) => {
        if (actionName) {
            try {
                await signModal.current.show(operation, actionName);
            } catch (err) {
                throw Error("User rejected");
            }
        }

        const requestId = operation.getRequestId(
            config.contracts.entryPoint,
            config.chainId,
        );

        const signature = await keyStore.sign(requestId);

        if (signature) {
            operation.signWithSignature(account, signature || "");

            const entryPointContract = new web3.eth.Contract(
                EntryPointABI,
                config.contracts.entryPoint,
            );

            const result = await entryPointContract.methods
                .simulateValidation(operation)
                .call({
                    from: WalletLib.EIP4337.Defines.AddressZero,
                });

            // IMPORTANT TODO, catch errors
            console.log(`SimulateValidation:`, result);

            browser.runtime.sendMessage({
                type: "execute",
                data: {
                    actionName,
                    operation: JSON.stringify(operation),
                    requestId,
                    tabId,
                },
            });

            return;
        }
    };

    const deleteWallet = async () => {
        await keyStore.delete();
    };

    const replaceAddress = async () => {
        await keyStore.replaceAddress();
        await getAccount();
    };

    const activateWallet = async () => {
        const actionName = "Activate Wallet";
        const currentFee = (await getGasPrice()) * config.feeMultiplier;
        const activateOp = WalletLib.EIP4337.activateWalletOp(
            config.contracts.logic,
            config.contracts.entryPoint,
            config.contracts.paymaster,
            account,
            config.contracts.weth,
            currentFee,
            currentFee,
            config.defaultSalt,
            config.contracts.create2Factory,
        );

        await executeOperation(activateOp, actionName);
    };

    const recoverWallet = async (newOwner: string, signatures: string[]) => {
        const { requestId, recoveryOp } = await getRecoverId(
            newOwner,
            walletAddress,
        );

        const entryPointContract = new web3.eth.Contract(
            EntryPointABI,
            config.contracts.entryPoint,
        );

        const signPack =
            await WalletLib.EIP4337.Guaridian.packGuardiansSignByRequestId(
                requestId,
                signatures,
                walletAddress,
                web3 as any,
            );

        recoveryOp.signature = signPack;

        const result = await entryPointContract.methods
            .simulateValidation(recoveryOp)
            .call({
                from: WalletLib.EIP4337.Defines.AddressZero,
            });
        console.log(`recoverOp simulateValidation result:`, result);

        await Utils.sendOPWait(
            // web3,
            recoveryOp,
            config.contracts.entryPoint,
            config.chainId,
            requestId,
        );
        // recovery now
        // browser.runtime.sendMessage({
        //     type: "notify",
        // });
    };
    const addGuardian = async (guardianAddress: string) => {
        const actionName = "Add Guardian";
        const currentFee = (await getGasPrice()) * config.feeMultiplier;
        const nonce = await WalletLib.EIP4337.Utils.getNonce(
            walletAddress,
            web3,
        );
        const addGuardianOp =
            await WalletLib.EIP4337.Guaridian.grantGuardianRequest(
                web3 as any,
                walletAddress,
                nonce,
                guardianAddress,
                config.contracts.entryPoint,
                config.contracts.paymaster,
                currentFee,
                currentFee,
            );
        if (!addGuardianOp) {
            throw new Error("addGuardianOp is null");
        }

        await executeOperation(addGuardianOp, actionName);
    };

    const removeGuardian = async (guardianAddress: string) => {
        const actionName = "Remove Guardian";
        const currentFee = (await getGasPrice()) * config.feeMultiplier;
        const nonce = await WalletLib.EIP4337.Utils.getNonce(
            walletAddress,
            web3,
        );
        const removeGuardianOp =
            await WalletLib.EIP4337.Guaridian.revokeGuardianRequest(
                web3 as any,
                walletAddress,
                nonce,
                guardianAddress,
                config.contracts.entryPoint,
                config.contracts.paymaster,
                currentFee,
                currentFee,
            );
        if (!removeGuardianOp) {
            throw new Error("removeGuardianOp is null");
        }

        await executeOperation(removeGuardianOp, actionName);
    };

    const getRecoverId = async (newOwner: string, walletAddress: string) => {
        let nonce = await WalletLib.EIP4337.Utils.getNonce(walletAddress, web3);
        const currentFee = (await getGasPrice()) * config.feeMultiplier;

        const recoveryOp = await WalletLib.EIP4337.Guaridian.transferOwner(
            web3 as any,
            walletAddress,
            nonce,
            config.contracts.entryPoint,
            config.contracts.paymaster,
            currentFee,
            currentFee,
            newOwner,
        );
        if (!recoveryOp) {
            throw new Error("recoveryOp is null");
        }
        // get requestId
        const requestId = recoveryOp.getRequestId(
            config.contracts.entryPoint,
            config.chainId,
        );

        return { requestId, recoveryOp };
    };

    const sendEth = async (to: string, amount: string) => {
        const actionName = "Send ETH";
        const currentFee = (await getGasPrice()) * config.feeMultiplier;
        const amountInWei = new BN(amount).shiftedBy(18).toString();
        const nonce = await WalletLib.EIP4337.Utils.getNonce(
            walletAddress,
            web3,
        );
        const op = await WalletLib.EIP4337.Tokens.ETH.transfer(
            web3,
            walletAddress,
            nonce,
            config.contracts.entryPoint,
            config.contracts.paymaster,
            currentFee,
            currentFee,
            to,
            amountInWei,
        );

        await executeOperation(op, actionName);
    };

    const sendErc20 = async (
        tokenAddress: string,
        to: string,
        amount: string,
    ) => {
        const actionName = "Send Assets";
        const currentFee = (await getGasPrice()) * config.feeMultiplier;
        const amountInWei = new BN(amount).shiftedBy(18).toString();
        const nonce = await WalletLib.EIP4337.Utils.getNonce(
            walletAddress,
            web3,
        );
        const op = await WalletLib.EIP4337.Tokens.ERC20.transfer(
            web3,
            walletAddress,
            nonce,
            config.contracts.entryPoint,
            config.contracts.paymaster,
            currentFee,
            currentFee,
            tokenAddress,
            to,
            amountInWei,
        );

        await executeOperation(op, actionName);
    };

    useEffect(() => {
        if (!account) {
            return;
        }
        getWalletAddress();
    }, [account]);

    useEffect(() => {
        if (!walletAddress) {
            return;
        }
        getWalletType();
    }, [walletAddress]);

    useEffect(() => {
        getAccount();
    }, []);

    return (
        <WalletContext.Provider
            value={{
                web3,
                account,
                walletType,
                walletAddress,
                getWalletAddress,
                getWalletAddressByEmail,
                getRecoverId,
                getAccount,
                signTransaction,
                executeOperation,
                recoverWallet,
                addGuardian,
                removeGuardian,
                getWalletType,
                getEthBalance,
                generateWalletAddress,
                getGasPrice,
                activateWallet,
                deleteWallet,
                sendErc20,
                sendEth,
                replaceAddress,
            }}
        >
            {children}
            <SignTransaction ref={signModal} />
        </WalletContext.Provider>
    );
};

export const WalletContextConsumer = WalletContext.Consumer;
