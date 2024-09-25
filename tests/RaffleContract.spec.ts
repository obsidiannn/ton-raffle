import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
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
            const getBalance1 = await raffleContract.getBalance();
            const deployResult = await raffleContract.sendInternalMsg(buyer.getSender(), toNano('1'));
            const getBalance2 = await raffleContract.getBalance();

            console.log(`buyer: `, name, '[before]', getBalance1, '[after]', getBalance2);
            if (getBalance1 > getBalance2) {
                console.log('发送奖品');
                console.log(deployResult.events);
                const currentBalance = await buyer.getBalance()
                console.log(`当前买家余额${currentBalance}`);

            }

            console.log('----------------');
        }
    })

});
