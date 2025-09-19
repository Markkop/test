#[starknet::interface]
pub trait IHabitsFarm<TContractState> {
    // User management
    fn register_user(ref self: TContractState, deposit_amount: u256);
    fn get_user_info(self: @TContractState, user: starknet::ContractAddress) -> UserInfo;
    fn withdraw_deposit(ref self: TContractState, amount: u256);
    
    // Habit management
    fn create_habit(ref self: TContractState, title: ByteArray, description: ByteArray, stake_amount: u256, duration_days: u32) -> u256;
    fn complete_habit(ref self: TContractState, habit_id: u256);
    fn get_habit(self: @TContractState, habit_id: u256) -> Habit;
    fn get_user_habits(self: @TContractState, user: starknet::ContractAddress) -> Array<u256>;
    
    // Rewards and staking
    fn claim_habit_reward(ref self: TContractState, habit_id: u256);
    fn calculate_staking_rewards(self: @TContractState, user: starknet::ContractAddress) -> u256;
    fn claim_staking_rewards(ref self: TContractState);
    
    // Admin functions
    fn set_base_reward_rate(ref self: TContractState, rate: u256);
    fn set_staking_apr(ref self: TContractState, apr: u256);
    fn get_total_deposits(self: @TContractState) -> u256;
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct UserInfo {
    pub is_registered: bool,
    pub total_deposit: u256,
    pub available_balance: u256,
    pub habits_created: u256,
    pub habits_completed: u256,
    pub last_staking_claim: u64,
    pub total_earned: u256,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Habit {
    pub id: u256,
    pub user: starknet::ContractAddress,
    pub title: ByteArray,
    pub description: ByteArray,
    pub stake_amount: u256,
    pub created_at: u64,
    pub duration_days: u32,
    pub is_completed: bool,
    pub completed_at: u64,
    pub reward_claimed: bool,
}

#[starknet::contract]
pub mod HabitsFarm {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess
    };
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use super::{IHabitsFarm, UserInfo, Habit};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // STRK token contract address on Starknet
    pub const STRK_CONTRACT: felt252 = 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;
    
    // Constants for calculations
    pub const SECONDS_PER_YEAR: u256 = 31536000; // 365 * 24 * 60 * 60
    pub const BASIS_POINTS: u256 = 10000; // 100% = 10000 basis points

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        UserRegistered: UserRegistered,
        HabitCreated: HabitCreated,
        HabitCompleted: HabitCompleted,
        RewardClaimed: RewardClaimed,
        StakingRewardsClaimed: StakingRewardsClaimed,
        DepositWithdrawn: DepositWithdrawn,
    }

    #[derive(Drop, starknet::Event)]
    struct UserRegistered {
        #[key]
        user: ContractAddress,
        deposit_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct HabitCreated {
        #[key]
        user: ContractAddress,
        #[key]
        habit_id: u256,
        title: ByteArray,
        stake_amount: u256,
        duration_days: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct HabitCompleted {
        #[key]
        user: ContractAddress,
        #[key]
        habit_id: u256,
        completion_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardClaimed {
        #[key]
        user: ContractAddress,
        #[key]
        habit_id: u256,
        reward_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct StakingRewardsClaimed {
        #[key]
        user: ContractAddress,
        reward_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct DepositWithdrawn {
        #[key]
        user: ContractAddress,
        amount: u256,
    }

    #[storage]
    struct Storage {
        // User data
        users: Map<ContractAddress, UserInfo>,
        user_habit_count: Map<ContractAddress, u256>,
        user_habits: Map<(ContractAddress, u256), u256>, // (user, index) -> habit_id
        
        // Habit data
        habits: Map<u256, Habit>,
        next_habit_id: u256,
        
        // Protocol settings
        base_reward_rate: u256, // Basis points (e.g., 1000 = 10%)
        staking_apr: u256, // Annual percentage rate in basis points
        total_deposits: u256,
        
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
        self.next_habit_id.write(1);
        self.base_reward_rate.write(2000); // 20% base reward rate
        self.staking_apr.write(500); // 5% APR for staking
    }

    #[abi(embed_v0)]
    impl HabitsFarmImpl of IHabitsFarm<ContractState> {
        fn register_user(ref self: ContractState, deposit_amount: u256) {
            let caller = get_caller_address();
            let mut user = self.users.read(caller);
            
            assert(!user.is_registered, 'User already registered');
            assert(deposit_amount > 0, 'Deposit must be positive');

            // Check user's STRK balance first to avoid underflows in the STRK contract
            let strk_dispatcher = IERC20Dispatcher {
                contract_address: STRK_CONTRACT.try_into().unwrap(),
            };

            let user_balance = strk_dispatcher.balance_of(caller);
            assert(user_balance >= deposit_amount, 'Insufficient STRK balance');

            // Transfer STRK from user to contract
            strk_dispatcher.transfer_from(caller, get_contract_address(), deposit_amount);
            
            // Initialize user
            user.is_registered = true;
            user.total_deposit = deposit_amount;
            user.available_balance = deposit_amount;
            user.habits_created = 0;
            user.habits_completed = 0;
            user.last_staking_claim = get_block_timestamp();
            user.total_earned = 0;
            
            self.users.write(caller, user);
            self.total_deposits.write(self.total_deposits.read() + deposit_amount);
            
            self.emit(UserRegistered { user: caller, deposit_amount });
        }

        fn get_user_info(self: @ContractState, user: ContractAddress) -> UserInfo {
            self.users.read(user)
        }

        fn withdraw_deposit(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let mut user = self.users.read(caller);
            
            assert(user.is_registered, 'User not registered');
            assert(amount <= user.available_balance, 'Insufficient balance');
            
            // Transfer STRK back to user
            let strk_dispatcher = IERC20Dispatcher { 
                contract_address: STRK_CONTRACT.try_into().unwrap() 
            };
            strk_dispatcher.transfer(caller, amount);
            
            // Update user balance
            user.available_balance -= amount;
            user.total_deposit -= amount;
            self.users.write(caller, user);
            self.total_deposits.write(self.total_deposits.read() - amount);
            
            self.emit(DepositWithdrawn { user: caller, amount });
        }

        fn create_habit(ref self: ContractState, title: ByteArray, description: ByteArray, stake_amount: u256, duration_days: u32) -> u256 {
            let caller = get_caller_address();
            let mut user = self.users.read(caller);
            
            assert(user.is_registered, 'User not registered');
            assert(stake_amount <= user.available_balance, 'Insufficient balance');
            assert(duration_days > 0, 'Duration must be positive');
            
            let habit_id = self.next_habit_id.read();
            
            // Create habit
            let habit = Habit {
                id: habit_id,
                user: caller,
                title: title.clone(),
                description: description.clone(),
                stake_amount,
                created_at: get_block_timestamp(),
                duration_days,
                is_completed: false,
                completed_at: 0,
                reward_claimed: false,
            };
            
            self.habits.write(habit_id, habit);
            
            // Update user data
            user.available_balance -= stake_amount;
            user.habits_created += 1;
            self.users.write(caller, user);
            
            // Add to user's habit list
            let current_count = self.user_habit_count.read(caller);
            self.user_habits.write((caller, current_count), habit_id);
            self.user_habit_count.write(caller, current_count + 1);
            
            // Increment habit counter
            self.next_habit_id.write(habit_id + 1);
            
            self.emit(HabitCreated { 
                user: caller, 
                habit_id, 
                title, 
                stake_amount,
                duration_days 
            });
            
            habit_id
        }

        fn complete_habit(ref self: ContractState, habit_id: u256) {
            let caller = get_caller_address();
            let mut habit = self.habits.read(habit_id);
            
            assert(habit.user == caller, 'Not habit owner');
            assert(!habit.is_completed, 'Habit already completed');
            
            let current_time = get_block_timestamp();
            let habit_deadline = habit.created_at + (habit.duration_days.into() * 86400); // days to seconds
            
            assert(current_time <= habit_deadline, 'Habit deadline passed');
            
            // Mark habit as completed
            habit.is_completed = true;
            habit.completed_at = current_time;
            self.habits.write(habit_id, habit);
            
            // Update user stats
            let mut user = self.users.read(caller);
            user.habits_completed += 1;
            self.users.write(caller, user);
            
            self.emit(HabitCompleted { 
                user: caller, 
                habit_id,
                completion_time: current_time 
            });
        }

        fn get_habit(self: @ContractState, habit_id: u256) -> Habit {
            self.habits.read(habit_id)
        }

        fn get_user_habits(self: @ContractState, user: ContractAddress) -> Array<u256> {
            let habit_count = self.user_habit_count.read(user);
            let mut habits_array = ArrayTrait::new();
            let mut i = 0;
            
            while i < habit_count {
                let habit_id = self.user_habits.read((user, i));
                habits_array.append(habit_id);
                i += 1;
            };
            
            habits_array
        }

        fn claim_habit_reward(ref self: ContractState, habit_id: u256) {
            let caller = get_caller_address();
            let mut habit = self.habits.read(habit_id);
            
            assert(habit.user == caller, 'Not habit owner');
            assert(habit.is_completed, 'Habit not completed');
            assert(!habit.reward_claimed, 'Reward already claimed');
            
            // Calculate reward (stake + bonus)
            let base_reward = habit.stake_amount;
            let bonus_reward = (habit.stake_amount * self.base_reward_rate.read()) / BASIS_POINTS;
            let total_reward = base_reward + bonus_reward;
            
            // Update habit
            habit.reward_claimed = true;
            self.habits.write(habit_id, habit);
            
            // Update user
            let mut user = self.users.read(caller);
            user.available_balance += total_reward;
            user.total_earned += bonus_reward;
            self.users.write(caller, user);
            
            self.emit(RewardClaimed { 
                user: caller, 
                habit_id,
                reward_amount: total_reward 
            });
        }

        fn calculate_staking_rewards(self: @ContractState, user: ContractAddress) -> u256 {
            let user_info = self.users.read(user);
            if !user_info.is_registered {
                return 0;
            }
            
            let current_time = get_block_timestamp();
            let time_elapsed = current_time - user_info.last_staking_claim;
            
            // Calculate annual reward and pro-rate it
            let annual_reward = (user_info.total_deposit * self.staking_apr.read()) / BASIS_POINTS;
            let reward = (annual_reward * time_elapsed.into()) / SECONDS_PER_YEAR;
            
            reward
        }

        fn claim_staking_rewards(ref self: ContractState) {
            let caller = get_caller_address();
            let rewards = self.calculate_staking_rewards(caller);
            
            if rewards > 0 {
                let mut user = self.users.read(caller);
                assert(user.is_registered, 'User not registered');
                
                user.available_balance += rewards;
                user.total_earned += rewards;
                user.last_staking_claim = get_block_timestamp();
                self.users.write(caller, user);
                
                self.emit(StakingRewardsClaimed { 
                    user: caller, 
                    reward_amount: rewards 
                });
            }
        }

        fn set_base_reward_rate(ref self: ContractState, rate: u256) {
            self.ownable.assert_only_owner();
            self.base_reward_rate.write(rate);
        }

        fn set_staking_apr(ref self: ContractState, apr: u256) {
            self.ownable.assert_only_owner();
            self.staking_apr.write(apr);
        }

        fn get_total_deposits(self: @ContractState) -> u256 {
            self.total_deposits.read()
        }
    }
}
