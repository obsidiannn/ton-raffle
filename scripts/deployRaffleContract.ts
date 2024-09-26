import { toNano } from '@ton/core';
import { RaffleContract } from '../wrappers/RaffleContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender()
    if (sender.address) {
        const raffleContract = provider.open(RaffleContract.createForDeploy({ adminAddr: sender.address }, await compile('RaffleContract')));
        await raffleContract.sendDeploy(provider.sender(), toNano('0.05'));
        await provider.waitForDeploy(raffleContract.address);
    }
}
