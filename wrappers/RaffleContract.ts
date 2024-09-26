import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

export type RaffleContractConfig = {
    adminAddr: Address
};

export function raffleContractConfigToCell(config: RaffleContractConfig): Cell {
    const data = beginCell()
        .storeCoins(toNano("0"))
        .storeCoins(toNano("0"))
        .storeAddress(config.adminAddr)
        .storeInt(0, 64)
        .storeInt(0, 256)
        .endCell();

    return data
}

export class RaffleContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new RaffleContract(address);
    }

    static createForDeploy(config: RaffleContractConfig, code: Cell, workchain = 0) {
        const data = raffleContractConfigToCell(config);
        const init = { code, data };
        return new RaffleContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendInternalMsg(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendWithdraw(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1002, 32).endCell()
        })
    }

    async sendAddBalance(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1003, 32).endCell()
        })
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_info", []);
        let available_balance = stack.readNumber();
        let service_balance = stack.readNumber();
        let admin_addr_workchain = stack.readNumber();
        let admin_addr = stack.readNumber();
        let last_number = stack.readNumber();
        //hash: stack.readNumber()
        return {
            available_balance,
            service_balance,
            admin_addr_workchain,
            admin_addr,
            last_number
        }
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("get_info", []);
        let available_balance = stack.readNumber();
        // const {} = await provider.get('get_balance',[])
        // console.log(`original balance =  ,target balance = ${available_balance}`);

        return available_balance;
    }

}
