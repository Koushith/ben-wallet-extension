import { ethers } from "ethers";
/**
 * @link https://github.com/eth-infinitism/account-abstraction/blob/develop/contracts/UserOperation.sol
 */
declare class UserOperation {
    sender: string;
    nonce: number;
    initCode: string;
    callData: string;
    callGasLimit: number;
    verificationGasLimit: number;
    preVerificationGas: number;
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
    paymasterAndData: string;
    signature: string;
    clone(): UserOperation;
    toTuple(): string;
    /**
     * estimate the gas
     * @param entryPointAddress the entry point address
     * @param estimateGasFunc the estimate gas function
     * @returns false if failed
     */
    estimateGas(entryPointAddress: string, etherProvider: ethers.providers.BaseProvider): Promise<boolean>;
    /**
     * get the paymaster sign hash
     * @returns
     */
    payMasterSignHash(): string;
    /**
     * sign the user operation
     * @param entryPoint the entry point address
     * @param chainId the chain id
     * @param privateKey the private key
     */
    sign(entryPoint: string, chainId: number, privateKey: string): void;
    /**
     * sign the user operation with personal sign
     * @param signAddress the sign address
     * @param signature the signature of the requestId
     */
    signWithSignature(signAddress: string, signature: string): void;
    /**
     * get the request id (userOp hash)
     * @param entryPointAddress the entry point address
     * @param chainId the chain id
     * @returns hex string
     */
    getRequestId(entryPointAddress: string, chainId: number): string;
}
export { UserOperation };
