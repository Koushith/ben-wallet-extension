//@ts-nocheck
import React, { useState } from "react";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { copyText } from "@src/lib/tools";
import Button from "@src/components/Button";
import IconCopy from "@src/assets/copy.svg";
import { getDefaultProvider, Wallet } from "ethers";
import { Accounts } from "../../lib/accounts";
import { keccak256 } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers";
import AccountModal from "../AccountModal";
const randomBytes = require("randombytes");

interface IProps {
    action: string;
}

export default function AccountInfo({ action }: IProps) {
    const navigate = useNavigate();
    let account: Accounts;

    const storedAccountAddress = localStorage.getItem("accountAddress");
    const [activated, setActivated] = useState<boolean>(false);
    const [accountOwnerAddress, setAccountOwnerAddress] = useState<string>("");
    const [accountAddress, setAccountAddress] = useState<string>(
        storedAccountAddress ? storedAccountAddress : "",
    );
    const [copied, setCopied] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const doCopy = () => {
        copyText(accountAddress);
        setCopied(true);
    };

    const doActivate = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setActivated(true);
            toast.success("Account activated");
        }, 1500);
    };

    const doRemove = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate("/wallet");
            toast.success("Guardian removed");
        }, 1500);
    };

    const createAccount = async () => {
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
        setAccountOwnerAddress(await accountOwner.getAddress());

        const index = Date.now();
        account = await new Accounts(accountOwner, index).init();

        let accountAddress = await account.getAddress();
        localStorage.setItem("accountAddress", accountAddress);

        setAccountAddress(accountAddress);

        await account.fundAccount(signer, accountAddress);

        const data = keccak256(Buffer.from("nonce()")).slice(0, 10);

        console.log("data=", data);
        await account.createSignedUserOp(accountAddress, data);

        account.getAccountInfo(accountAddress);

        await account.createRecovery(
            accountAddress,
            "0x2DF1592238420ecFe7f2431360e224707e77fA0E",
            123,
        );

        doActivate();
    };

    const createRecovery = async () => {
        console.log(account);
    };

    const accountModalId = "accountModalId";

    return (
        <div className="p-4 pt-0 text-center flex flex-col items-center justify-between">
            <label htmlFor={accountModalId} className="cursor:pointer">
                <Jazzicon
                    diameter={90}
                    seed={jsNumberForAddress(accountAddress)}
                />
            </label>
            <div className="text-lg mt-1 mb-2">Account 1</div>
            <div
                className="gap-2 flex items-center cursor-pointer tooltip"
                data-tip={copied ? "Copied" : "Click to copy"}
                onMouseLeave={() => setTimeout(() => setCopied(false), 400)}
                onClick={doCopy}
            >
                <img src={IconCopy} className="w-4 opacity-50" />
                <span className="opacity-50 text-base text-black">
                    {accountAddress.slice(0, 4)}...{accountAddress.slice(-4)}
                </span>
            </div>
            {action === "activate" && !activated && (
                <Button
                    classNames="btn-blue mb-4 mt-6"
                    onClick={createAccount}
                    loading={loading}
                >
                    Activate Account
                </Button>
            )}
            {action === "remove" && (
                <Button
                    classNames="btn-red mt-6"
                    onClick={doRemove}
                    loading={loading}
                >
                    Remove
                </Button>
            )}

            <AccountModal
                address={accountOwnerAddress}
                modalId={accountModalId}
                onClose={() => {}}
            />
        </div>
    );
}
