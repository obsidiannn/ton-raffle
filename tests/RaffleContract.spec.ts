import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, fromNano, toNano } from '@ton/core';
import { RaffleContract } from '../wrappers/RaffleContract';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('RaffleContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('RaffleContract');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let raffleContract: SandboxContract<RaffleContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer', { balance: toNano('100000') });
        console.log(`[deployer] = ${deployer.address}`);

        const balance = await deployer.getBalance()

        console.log(`[deployer balance] ${balance}`);
        raffleContract = blockchain.openContract(RaffleContract.createForDeploy({ adminAddr: deployer.address }, code));

        const deployResult = await raffleContract.sendDeploy(deployer.getSender(), toNano('500'));

        const balanceAfter = await deployer.getBalance()
        console.log(`[deployer balance] after ${balanceAfter}`);

        console.log(deployResult.events);

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: raffleContract.address,
        //     deploy: true,
        //     success: true,
        // });

        console.log('success deploy');


    });

    it('单次抽奖', async () => {
        const buyer = await blockchain.treasury('buyer')
        const getBalance1 = await raffleContract.getBalance();
        const deployResult = await raffleContract.sendInternalMsg(buyer.getSender(), toNano('1'));
        printTransactionFees(deployResult.transactions)

        const getBalance2 = await raffleContract.getBalance();
        console.log(`balance1: ${getBalance1} balance2: ${getBalance2}`);
        expect(getBalance1 <= getBalance2).toBeTruthy()
    });

    it('多次多人抽奖', async () => {
        for (let index = 0; index < 100; index++) {
            const name = 'buyer' + index
            const buyer = await blockchain.treasury(name)
            const buyerBalance = await buyer.getBalance()
            const getBalance1 = await raffleContract.getBalance();
            const deployResult = await raffleContract.sendInternalMsg(buyer.getSender(), toNano('1'));
            const getBalance2 = await raffleContract.getBalance();

            console.log(`contract balance = ${fromNano(getBalance1)} -> ${fromNano(getBalance2)}`);
            if (getBalance1 > getBalance2) {
                console.log('发送奖品');
                console.log(deployResult.events);
            }

            const buyerBalance2 = await buyer.getBalance()
            console.log(`buyer ${name} balance = ${fromNano(buyerBalance)} -> ${fromNano(buyerBalance2)}`);


            console.log('----------------');
        }
    })

    it('多次抽奖后，管理员提现', async () => {
        for (let index = 0; index < 100; index++) {
            const buyer = await blockchain.treasury('buyer' + index)
            await raffleContract.sendInternalMsg(buyer.getSender(), toNano('1'));
        }

        const balance = await deployer.getBalance()

        const data = await raffleContract.getData()
        console.log('data=', data);
        await raffleContract.sendWithdraw(deployer.getSender(), toNano('0.01'))
        const data2 = await raffleContract.getData()

        const balance2 = await deployer.getBalance()

        console.log('data=', data2);
        console.log(`balance: ${balance} -> ${balance2}`);

    })

});
