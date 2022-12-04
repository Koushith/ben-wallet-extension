// @ts-nocheck
import React, { useState, useEffect } from "react";
import Logo from "@src/components/Logo";
import Button from "@src/components/Button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getDefaultProvider, Wallet } from "ethers";

import ImgSuccessCat from "@src/assets/success-cat.svg";
import { Accounts } from "@src/lib/accounts";

import { Input } from "@src/components/Input";
import { ToastContainer, toast } from "material-react-toastify";
import { keccak256 } from "ethers/lib/utils";

import "material-react-toastify/dist/ReactToastify.css";

export function RecoverWallet() {
    let account: Accounts;
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const recoverWalletStatus = () =>
        toast.success(" Account Recovered successfully !");

    const recoverHandler = () => {
        // recover logic
        setLoading(true);

        localStorage.setItem("accountAddress", walletAddress);

        setTimeout(() => {
            recoverWalletStatus();
            setLoading(false);
        }, 3000);
    };

    const createRecovery = async () => {
        const network = "http://localhost:8545";
        const bundlerUrl = "http://localhost:3000/rpc";
        const deployDeployer = true;
        const provider = getDefaultProvider(network) as JsonRpcProvider;
        const signer = provider.getSigner();

        // account owner address
        const storedAccountOwner = localStorage.getItem("accountOwner");

        let accountOwner;
        if (storedAccountOwner) {
            accountOwner = new Wallet(storedAccountOwner);
        } else {
            const privateKey = randomBytes(32).toString("hex");
            accountOwner = new Wallet(privateKey);
            localStorage.setItem("accountOwner", privateKey);
        }
        console.log(accountOwner);

        const index = Date.now();
        account = await new Accounts(accountOwner, index).init();

        let accountAddress = await account.getAddress();
        localStorage.setItem("accountAddress", accountAddress);

        await account.fundAccount(signer, accountAddress);

        const data = keccak256(Buffer.from("nonce()")).slice(0, 10);

        await account.createRecovery(
            accountAddress,
            "0x2DF1592238420ecFe7f2431360e224707e77fA0E",
            123,
        );

        recoverHandler();
    };

    return (
        <>
            <ToastContainer />
            <div className="p-6 h-full flex flex-col">
                <Logo />

                <>
                    <div className="page-title mb-4">Recover Wallet</div>

                    <Input
                        placeholder="Enter Account Address"
                        value={walletAddress}
                        onChange={setWalletAddress}
                    />
                    <a
                        className="btn btn-blue w-full mt-6"
                        onClick={createRecovery}
                    >
                        {loading ? "Recovering..." : "Recover"}
                    </a>
                    {/* reocover success -conditional rendering*/}
                    {/* <RecoverySuccess /> */}
                </>
            </div>
        </>
    );
}

export const RecoverySuccess = () => {
    return (
        <>
            <img src={ImgSuccessCat} className="block mx-auto mb-12" />
            <div className="page-title mb-3">Congratulation!</div>
            <div className="page-desc leading-6">Your wallet is recovered!</div>
            <div className="fixed bottom-10 left-6 right-6">
                <Link to="/wallet" className="btn btn-blue w-full">
                    My Wallet
                </Link>
            </div>
        </>
    );
};
