import Link from "next/link";
import Image from "next/image";
import { ConnectedAddress } from "~~/components/ConnectedAddress";

const Home = () => {
  return (
    <div className="flex items-center flex-col grow pt-10">
      {/* Hero Section */}
      <div className="px-5 text-center">
        <h1 className="text-center mb-8">
          <span className="block text-6xl mb-4">🌱</span>
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Habits Farm
          </span>
        </h1>
        <ConnectedAddress />
        <p className="text-center text-xl max-w-3xl mx-auto mb-8 text-gray-600">
          Transform your habits into wealth! Stake STRK tokens, set personal goals, 
          and earn rewards for completing them. Your deposits earn 5% APR while building discipline.
        </p>
        
        <Link 
          href="/habits" 
          className="btn btn-primary btn-lg mb-4"
        >
          🚀 Start Your Journey
        </Link>
      </div>

      <div className="bg-container grow w-full mt-16 px-8 py-12">
        {/* Features Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="flex flex-col bg-base-100 relative px-6 py-8 text-center items-center rounded-3xl border border-gradient shadow-xl">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-bold mb-2">Deposit STRK</h3>
              <p className="text-sm text-gray-600">
                Join with a STRK deposit that earns 5% APR automatically while you build habits.
              </p>
            </div>
            
            <div className="flex flex-col bg-base-100 relative px-6 py-8 text-center items-center rounded-3xl border border-gradient shadow-xl">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold mb-2">Create Habits</h3>
              <p className="text-sm text-gray-600">
                Set goals with stake amounts as motivation. Higher stakes = stronger commitment.
              </p>
            </div>
            
            <div className="flex flex-col bg-base-100 relative px-6 py-8 text-center items-center rounded-3xl border border-gradient shadow-xl">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-bold mb-2">Complete Goals</h3>
              <p className="text-sm text-gray-600">
                Mark habits complete within deadlines to get your stake back plus 20% bonus.
              </p>
            </div>
            
            <div className="flex flex-col bg-base-100 relative px-6 py-8 text-center items-center rounded-3xl border border-gradient shadow-xl">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-bold mb-2">Earn Rewards</h3>
              <p className="text-sm text-gray-600">
                Claim habit bonuses and passive staking rewards. Build wealth through consistency!
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-8">Why Choose Habits Farm?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card bg-gradient-to-br from-primary/10 to-accent/10 shadow-xl">
                <div className="card-body text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h3 className="card-title text-lg justify-center">Real Accountability</h3>
                  <p className="text-sm">Put your money where your mouth is. Financial stakes create genuine motivation.</p>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-success/10 to-primary/10 shadow-xl">
                <div className="card-body text-center">
                  <div className="text-3xl mb-2">💎</div>
                  <h3 className="card-title text-lg justify-center">Passive Income</h3>
                  <p className="text-sm">Earn 5% APR on all deposits. Your money grows even when you're not active.</p>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-warning/10 to-error/10 shadow-xl">
                <div className="card-body text-center">
                  <div className="text-3xl mb-2">🎁</div>
                  <h3 className="card-title text-lg justify-center">Bonus Rewards</h3>
                  <p className="text-sm">Get 20% bonus on completed habits. Turn discipline into profit.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="divider my-12"></div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Developer Tools</h2>
            <p className="text-gray-600">Built on Scaffold-Stark 2 for Starknet development</p>
          </div>
          
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 relative px-8 py-6 text-center items-center max-w-xs rounded-3xl border border-gradient shadow-xl">
              <Image
                src="/debug-icon.svg"
                alt="Debug Contracts"
                width={26}
                height={30}
                className="mb-4"
              />
              <h3 className="font-bold mb-2">Debug Contracts</h3>
              <p className="text-sm text-gray-600">
                Interact directly with the HabitsFarm smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                interface.
              </p>
            </div>
            
            <div className="flex flex-col bg-base-100 relative px-8 py-6 text-center items-center max-w-xs rounded-3xl border border-gradient shadow-xl">
              <Image
                src="/explorer-icon.svg"
                alt="Block Explorer"
                width={20}
                height={32}
                className="mb-4"
              />
              <h3 className="font-bold mb-2">Block Explorer</h3>
              <p className="text-sm text-gray-600">
                Track all transactions and explore the blockchain with our integrated{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
