/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-11-04 21:46:05
 * @LastEditors: cejay
 * @LastEditTime: 2022-11-23 16:26:23
 */

import { execFromEntryPoint } from './ABI/execFromEntryPoint';
import Web3 from 'web3';
import { ethers } from "ethers";
import fs from 'fs';
import { Utils } from './Utils';
import { WalletLib } from 'soul-wallet-lib';
import { AbiItem } from 'web3-utils';

async function main() {

    /*
     local env:

     1 install: npm install ganache --global
     2 run:     ganache
     */
    const web3 = new Web3('http://127.0.0.1:8545');
    const ethersProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const num = await ethersProvider.getBlockNumber();


    const entryPointPath = './test/contracts/EntryPoint.sol';
    const smartWalletPath = './test/contracts/SmartWallet.sol';
    const wethPaymasterPath = './test/contracts/WETHPaymaster.sol';
    const bundlerHelperPath = './test/contracts/BundlerHelper.sol';

    const chainId = await web3.eth.getChainId();

    // get account from web3 rpc node
    let accounts = await web3.eth.personal.getAccounts();

    // new account
    const walletUser = await web3.eth.accounts.create();



    //#region  deploy eip-2470

    const SingletonFactory = '0xce0042B868300000d44A59004Da54A005ffdcf9f';

    // Send exactly 0.0247 ether to this single-use deployment account to 0xBb6e024b9cFFACB947A71991E386681B1Cd1477D
    // https://eips.ethereum.org/EIPS/eip-2470
    await web3.eth.sendTransaction(
        {
            from: accounts[0],
            to: '0xBb6e024b9cFFACB947A71991E386681B1Cd1477D',
            value: web3.utils.toWei('0.0247', 'ether')
        }
    );
    /*
    0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470
     {
        nonce: 0,
        gasPrice: 100000000000,
        value: 0,
        data: '0x608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c63430006020033',
        gasLimit: 247000,
        v: 27,
        r: '0x247000',
        s: '0x2470'
    }
    */
    try {
        await web3.eth.sendSignedTransaction(
            '0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470'
        );
    } catch (error) { }

    // check if SingletonFactory is deployed
    let code = await web3.eth.getCode(SingletonFactory);
    if (code === '0x') {
        throw new Error('SingletonFactory is not deployed');
    } else {
        console.log('SingletonFactory is deployed');
    }

    //#endregion

    //#region deploy entrypoint
    let entrypointCompile = await Utils.compileContract(entryPointPath, 'EntryPoint');
    // deploy bytecode
    let EntryPointAddress = '';
    var _paymasterStake = web3.utils.toWei('1', 'ether');
    var _unstakeDelaySec = 100;
    var entrypointContract = new web3.eth.Contract(entrypointCompile.abi);
    entrypointContract.deploy({
        data: '0x' + entrypointCompile.bytecode,
        arguments: [
            _paymasterStake,
            _unstakeDelaySec,
        ]
    }).send({
        from: accounts[0],
        gas: 10000000,
    }).on('receipt', async (receipt) => {
        //console.log('entrypointContract deployed at: ' + receipt.contractAddress);
        if (receipt.contractAddress) {
            EntryPointAddress = receipt.contractAddress;
        }

    }).on('error', (error) => {
        console.log(error);
    });
    while (EntryPointAddress === '') {
        await Utils.sleep(1000);
        console.log('waiting for entrypointContract to be deployed');
    }
    entrypointContract.options.address = EntryPointAddress;
    console.log('EntryPointAddress: ' + EntryPointAddress);

    //#endregion

    //#region deploy wallet logic

    let walletLogicCompile = await Utils.compileContract(smartWalletPath, 'SmartWallet');
    // deploy bytecode
    let SmartWalletLogicAddress = '';

    var walletLogicContract = new web3.eth.Contract(walletLogicCompile.abi);
    walletLogicContract.deploy({
        data: '0x' + walletLogicCompile.bytecode,
        arguments: []
    }).send({
        from: accounts[0],
        gas: 10000000,
    }).on('receipt', async (receipt) => {
        //console.log('walletContract deployed at: ' + receipt.contractAddress);
        if (receipt.contractAddress) {
            SmartWalletLogicAddress = receipt.contractAddress;
        }
    }).on('error', (error) => {
        console.log(error);
    });
    while (SmartWalletLogicAddress === '') {
        await Utils.sleep(1000);
        console.log('waiting for walletLogicContract to be deployed');
    }
    console.log('SmartWalletLogicAddress: ' + SmartWalletLogicAddress);


    //#endregion

    //#region deploy weth

    const _weth_bytecode = '0x606060405260408051908101604052600d81527f57726170706564204574686572000000000000000000000000000000000000006020820152600090805161004b9291602001906100b1565b5060408051908101604052600481527f5745544800000000000000000000000000000000000000000000000000000000602082015260019080516100939291602001906100b1565b506002805460ff1916601217905534156100ac57600080fd5b61014c565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100f257805160ff191683800117855561011f565b8280016001018555821561011f579182015b8281111561011f578251825591602001919060010190610104565b5061012b92915061012f565b5090565b61014991905b8082111561012b5760008155600101610135565b90565b6106a98061015b6000396000f3006060604052600436106100955763ffffffff60e060020a60003504166306fdde03811461009f578063095ea7b31461012957806318160ddd1461015f57806323b872dd146101845780632e1a7d4d146101ac578063313ce567146101c257806370a08231146101eb57806395d89b411461020a578063a9059cbb1461021d578063d0e30db014610095578063dd62ed3e1461023f575b61009d610264565b005b34156100aa57600080fd5b6100b26102ba565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100ee5780820151838201526020016100d6565b50505050905090810190601f16801561011b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561013457600080fd5b61014b600160a060020a0360043516602435610358565b604051901515815260200160405180910390f35b341561016a57600080fd5b6101726103c4565b60405190815260200160405180910390f35b341561018f57600080fd5b61014b600160a060020a03600435811690602435166044356103d2565b34156101b757600080fd5b61009d600435610518565b34156101cd57600080fd5b6101d56105c6565b60405160ff909116815260200160405180910390f35b34156101f657600080fd5b610172600160a060020a03600435166105cf565b341561021557600080fd5b6100b26105e1565b341561022857600080fd5b61014b600160a060020a036004351660243561064c565b341561024a57600080fd5b610172600160a060020a0360043581169060243516610660565b600160a060020a033316600081815260036020526040908190208054349081019091557fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c915190815260200160405180910390a2565b60008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156103505780601f1061032557610100808354040283529160200191610350565b820191906000526020600020905b81548152906001019060200180831161033357829003601f168201915b505050505081565b600160a060020a03338116600081815260046020908152604080832094871680845294909152808220859055909291907f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259085905190815260200160405180910390a350600192915050565b600160a060020a0330163190565b600160a060020a038316600090815260036020526040812054829010156103f857600080fd5b33600160a060020a031684600160a060020a0316141580156104425750600160a060020a038085166000908152600460209081526040808320339094168352929052205460001914155b156104a957600160a060020a03808516600090815260046020908152604080832033909416835292905220548290101561047b57600080fd5b600160a060020a03808516600090815260046020908152604080832033909416835292905220805483900390555b600160a060020a038085166000818152600360205260408082208054879003905592861680825290839020805486019055917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9085905190815260200160405180910390a35060019392505050565b600160a060020a0333166000908152600360205260409020548190101561053e57600080fd5b600160a060020a033316600081815260036020526040908190208054849003905582156108fc0290839051600060405180830381858888f19350505050151561058657600080fd5b33600160a060020a03167f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b658260405190815260200160405180910390a250565b60025460ff1681565b60036020526000908152604090205481565b60018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156103505780601f1061032557610100808354040283529160200191610350565b60006106593384846103d2565b9392505050565b6004602090815260009283526040808420909152908252902054815600a165627a7a72305820ddedfb0ba7e4ed5e2c335eb9d42541173b86cda8a54f6c59663d43605e3dfc040029';
    const _weth_abi: AbiItem[] = [
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "guy",
                    "type": "address"
                },
                {
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "src",
                    "type": "address"
                },
                {
                    "name": "dst",
                    "type": "address"
                },
                {
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "withdraw",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "dst",
                    "type": "address"
                },
                {
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "deposit",
            "outputs": [],
            "payable": true,
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                },
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "src",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "guy",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "src",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "dst",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "dst",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "Deposit",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "src",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "wad",
                    "type": "uint256"
                }
            ],
            "name": "Withdrawal",
            "type": "event"
        }
    ];
    let WEthAddress = '';

    var wethContract = new web3.eth.Contract(_weth_abi);
    wethContract.deploy({
        data: _weth_bytecode,
        arguments: []
    }).send({
        from: accounts[0],
        gas: 1000000,
    }).on('receipt', async (receipt) => {
        //console.log('walletContract deployed at: ' + receipt.contractAddress);
        if (receipt.contractAddress) {
            WEthAddress = receipt.contractAddress;
        }
    }).on('error', (error) => {
        console.log(error);
    });
    while (WEthAddress === '') {
        await Utils.sleep(1000);
        console.log('waiting for weth to be deployed');
    }
    wethContract.options.address = WEthAddress;
    console.log('WEthAddress: ' + WEthAddress);


    //#endregion

    //#region deploy wethpaymaster

    let wethPaymasterCompile = await Utils.compileContract(wethPaymasterPath, 'WETHTokenPaymaster');
    // deploy bytecode
    await Utils.sleep(1000);
    let WETHPaymasterAddress = '';
    var WETHPaymasterContract = new web3.eth.Contract(wethPaymasterCompile.abi);
    WETHPaymasterContract.deploy({
        data: '0x' + wethPaymasterCompile.bytecode,
        arguments: [
            // constructor(EntryPoint _entryPoint,address _owner, IERC20 _WETHToken)
            EntryPointAddress,
            accounts[0],
            WEthAddress
        ]
    }).send({
        from: accounts[0],
        gas: 10000000,
    }).on('receipt', async (receipt) => {
        //console.log('entrypointContract deployed at: ' + receipt.contractAddress);
        if (receipt.contractAddress) {
            WETHPaymasterAddress = receipt.contractAddress;
        }

    }).on('error', (error) => {
        console.log(error);
    });
    while (WETHPaymasterAddress === '') {
        await Utils.sleep(1000);
        console.log('waiting for WETHPaymaster to be deployed');
    }
    console.log('WETHPaymasterAddress: ' + WETHPaymasterAddress);


    //#endregion

    //#region wethpaymaster stake

    let wethPaymasterContract = new web3.eth.Contract(wethPaymasterCompile.abi, WETHPaymasterAddress);
    const addStakeCallData = wethPaymasterContract.methods.addStake(
        1
    ).encodeABI();
    const addStakeTx = {
        from: accounts[0],
        to: WETHPaymasterAddress,
        data: addStakeCallData,
        gas: 10000000,
        value: _paymasterStake
    };
    const addStakeReceipt = await web3.eth.sendTransaction(addStakeTx);
    //
    const depositCallData = wethPaymasterContract.methods.deposit().encodeABI();
    const depositTx = {
        from: accounts[0],
        to: WETHPaymasterAddress,
        data: depositCallData,
        gas: 10000000,
        value: web3.utils.toWei('1', 'ether')
    };
    const depositReceipt = await web3.eth.sendTransaction(depositTx);
    //console.log('addStakeReceipt: ' + JSON.stringify(addStakeReceipt));

    //#endregion

    //#region calculate wallet address

    let walletAddress = await WalletLib.EIP4337.calculateWalletAddress(
        SmartWalletLogicAddress, EntryPointAddress, walletUser.address, WEthAddress, WETHPaymasterAddress, 0, SingletonFactory
    );
    console.log('walletAddress: ' + walletAddress);
    //#endregion

    //#region swap eth to weth
    // account[0] send 1 eth to WEthAddress
    const swapEthToWethTx = {
        from: accounts[0],
        to: WEthAddress,
        data: '0x',
        gas: 10000000,
        value: web3.utils.toWei('1', 'ether')
    };
    const swapEthToWethReceipt = await web3.eth.sendTransaction(swapEthToWethTx);
    // wait for transaction to be mined
    // get balance of weth
    let wethBalance = await wethContract.methods.balanceOf(accounts[0]).call();
    console.log('wethBalance: ' + web3.utils.fromWei(wethBalance, 'ether'), 'WETH');


    //#endregion

    //#region send weth to wallet

    // account[0] send 1 weth to walletAddress
    await wethContract.methods.transfer(walletAddress, web3.utils.toWei('1', 'ether')).send({
        from: accounts[0],
        gas: 10000000,
    });
    // get balance of weth
    wethBalance = await wethContract.methods.balanceOf(walletAddress).call();
    console.log('Wallet wethBalance: ' + web3.utils.fromWei(wethBalance, 'ether'), 'WETH');
    //#endregion

    //#region deploy bundler helper

    let BundlerHelperCompile = await Utils.compileContract(bundlerHelperPath, 'BundlerHelper');
    // deploy bytecode
    let BundlerHelperAddress = '';
    var BundlerHelperContract = new web3.eth.Contract(BundlerHelperCompile.abi);
    BundlerHelperContract.deploy({
        data: '0x' + BundlerHelperCompile.bytecode,
        arguments: [
        ]
    }).send({
        from: accounts[0],
        gas: 10000000,
    }).on('receipt', async (receipt) => {
        //console.log('entrypointContract deployed at: ' + receipt.contractAddress);
        if (receipt.contractAddress) {
            BundlerHelperAddress = receipt.contractAddress;
        }

    }).on('error', (error) => {
        console.log(error);
    });
    while (BundlerHelperAddress === '') {
        await Utils.sleep(1000);
        console.log('waiting for BundlerHelper to be deployed');
    }
    BundlerHelperContract.options.address = BundlerHelperAddress;
    console.log('BundlerHelperAddress: ' + BundlerHelperAddress);


    //#endregion

    //#region deploy wallet

    const activateOp = WalletLib.EIP4337.activateWalletOp(
        SmartWalletLogicAddress,
        EntryPointAddress,
        WETHPaymasterAddress,
        walletUser.address,
        WEthAddress,
        parseInt(web3.utils.toWei('100', 'gwei')),
        parseInt(web3.utils.toWei('10', 'gwei')),
        0,
        SingletonFactory
    );
    {
        // calculate create2 cost
        const singletonFactoryContract = new web3.eth.Contract([{ "inputs": [{ "internalType": "bytes", "name": "_initCode", "type": "bytes" }, { "internalType": "bytes32", "name": "_salt", "type": "bytes32" }], "name": "deploy", "outputs": [{ "internalType": "address payable", "name": "createdContract", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }], SingletonFactory);
        const _initCode = WalletLib.EIP4337.getWalletCode(SmartWalletLogicAddress, EntryPointAddress, walletUser.address, WEthAddress, WETHPaymasterAddress);
        const _salt = web3.utils.soliditySha3(WalletLib.EIP4337.number2Bytes32(0));
        const create2Cost = await singletonFactoryContract.methods.deploy(_initCode, _salt).estimateGas({
            from: WalletLib.EIP4337.Defines.AddressZero,
            gas: Math.pow(10, 18),
        });
        console.log('create2Cost: ' + create2Cost);
    }
    {
        // get preOpGas prefund

    }
    //
    //console.log(activateOp);
    {
        // get maxFeePerGas and PriorityFeePerGas
        const gasPrice = await web3.eth.getGasPrice();
        const maxFeePerGas = parseInt(gasPrice) * 100;
        const PriorityFeePerGas = parseInt(gasPrice) * 10;


        // test gas
        // activateOp.callGasLimit = 0;
        // activateOp.maxFeePerGas
    }

    const requestId = activateOp.getRequestId(EntryPointAddress, chainId);
    {
        //  function getRequestId(UserOperation calldata userOp) public view returns (bytes32) 
        const _requestid = await entrypointContract.methods.getRequestId(activateOp).call();
        if (_requestid !== requestId) {
            throw new Error('requestId mismatch');
        }

    }


    const signature = await web3.eth.accounts.sign(requestId, walletUser.privateKey);
    activateOp.signWithSignature(walletUser.address, signature.signature);
    await Utils.sleep(1000);
    try {
        const result = await entrypointContract.methods.simulateValidation(activateOp, false).call({
            from: WalletLib.EIP4337.Defines.AddressZero
        });
        console.log(`simulateValidation result:`, result);

    } catch (error) {
        throw error;
    }

    {
        // simulate via bundlerHelper
        // function handleOps(uint expectedPaymentGas, EntryPoint ep, UserOperation[] calldata ops, address payable beneficiary)
        {
            const re = await BundlerHelperContract.methods.handleOps(0, EntryPointAddress, [activateOp], accounts[0]).encodeABI();
            console.log('handleOps: ' + re);
            let tx = {
                from: WalletLib.EIP4337.Defines.AddressZero,
                to: BundlerHelperAddress,
                data: re,
            };
            const ggg = await ethersProvider.estimateGas(tx);
            console.log('ggg: ' + ggg);
        }
        const re = await BundlerHelperContract.methods.handleOps(0, EntryPointAddress, [activateOp], accounts[0]).call({
            from: WalletLib.EIP4337.Defines.AddressZero
        });
        console.log('handleOps result: ', re);
        // get tx info



    }
    {
        const arr1 = await WalletLib.EIP4337.RPC.waitUserOperation(ethersProvider, EntryPointAddress, requestId, 1000 * 5);
        console.log('waitUserOperation result: ', arr1);

    }

    // deploy wallet
    await entrypointContract.methods.handleOps([activateOp], accounts[0]).send({
        from: accounts[0],
        gas: 10000000,
    });
    // wait
    while (await web3.eth.getCode(walletAddress) === '0x') {
        await Utils.sleep(1000);
        console.log('waiting for wallet to be deployed');
    }
    console.log('wallet deployed');


    //#endregion


    //#region send weth from eip4337 wallet
    // get nonce
    const nonce = await WalletLib.EIP4337.Utils.getNonce(walletAddress, ethersProvider);

    const sendErc20Op = await WalletLib.EIP4337.Tokens.ERC20.transferFrom(
        ethersProvider, walletAddress,
        nonce, EntryPointAddress, WETHPaymasterAddress,
        parseInt(web3.utils.toWei('100', 'gwei')),
        parseInt(web3.utils.toWei('10', 'gwei')),
        WEthAddress, walletAddress, accounts[1], web3.utils.toWei('0.1', 'ether')
    );
    if (!sendErc20Op) {
        throw new Error('sendErc20Op is null');
    }
    const sendErc20RequestId = sendErc20Op.getRequestId(EntryPointAddress, chainId);
    const sendErc20Signature = await web3.eth.accounts.sign(sendErc20RequestId, walletUser.privateKey);
    sendErc20Op.signWithSignature(walletUser.address, sendErc20Signature.signature);
    wethBalance = await wethContract.methods.balanceOf(accounts[1]).call();
    console.log(' accounts[1] wethBalance: ' + web3.utils.fromWei(wethBalance, 'ether'), 'WETH');
    await entrypointContract.methods.handleOps([sendErc20Op], accounts[0]).send({
        from: accounts[0],
        gas: 10000000,
    });

    wethBalance = await wethContract.methods.balanceOf(accounts[1]).call();
    console.log(' accounts[1] wethBalance: ' + web3.utils.fromWei(wethBalance, 'ether'), 'WETH');




    //#endregion










}

main();