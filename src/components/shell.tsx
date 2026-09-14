'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AppConfig } from '../lib/types';
import { short } from '../lib/client';
import { useWallet, WalletProvider } from './wallet';
import { Modal } from './modal';

const STOCKSWAP_TOKEN_ADDRESS = '0x8b0396edc86f3f19c032804ff4b07c1f5fc434a5';
const STOCKSWAP_TOKEN_URL = `https://robinhoodchain.blockscout.com/address/${STOCKSWAP_TOKEN_ADDRESS}`;

function Header({ config }: { config: AppConfig }) {
  const path = usePathname();
  const wallet = useWallet();
  const [show, setShow] = useState(false);

  return (
    <>
      <header className="header">
        <Link href="/" className="brand" aria-label="StockSwap home">
          <span className="brand-mark">
            <img src="/stockswap-logo.png" alt="" width={35} height={35} />
          </span>
          StockSwap<span className="brand-period">.</span>
        </Link>

        <nav aria-label="Main navigation">
          <Link className={path === '/' || path.startsWith('/swap') ? 'active' : ''} href="/">
            Swap
          </Link>
          <Link className={path.startsWith('/explore') ? 'active' : ''} href="/explore">
            Explore
          </Link>
          <Link className={path === '/activity' ? 'active' : ''} href="/activity">
            Activity
          </Link>
        </nav>

        <div className="header-actions">
          <button className="network-button" onClick={() => setShow(true)}>
            <span className="network-dot" />
            <span>{config.testnet ? 'Testnet' : 'Robinhood Chain'}</span>
            <ChevronDown size={14} />
          </button>

          <a
            className="contract-link"
            href={STOCKSWAP_TOKEN_URL}
            target="_blank"
            rel="noreferrer"
            title={`StockSwap contract: ${STOCKSWAP_TOKEN_ADDRESS}`}
            aria-label={`View StockSwap contract ${STOCKSWAP_TOKEN_ADDRESS} on the block explorer`}
          >
            <span className="contract-label">CA</span>
            <span>{short(STOCKSWAP_TOKEN_ADDRESS)}</span>
            <ArrowUpRight size={12} aria-hidden="true" />
          </a>

          <button className="connect-button" onClick={wallet.open}>
            <Wallet size={16} />
            <span>{wallet.address ? short(wallet.address) : 'Connect wallet'}</span>
          </button>
        </div>
      </header>

      {show && (
        <Modal title="Network" onClose={() => setShow(false)}>
          <div className="network-info">
            <span className="network-dot" />
            <strong>{config.chainName}</strong>
            <span className="tag">{config.testnet ? 'TESTNET' : 'MAINNET'}</span>
          </div>
          <p className="modal-intro">
            {config.testnet
              ? 'Testnet tokens have no monetary value. Only assets verified for this network can be swapped.'
              : 'This network uses real assets. Execution must be enabled by the operator.'}
          </p>
          <dl className="detail-list">
            <div>
              <dt>Chain ID</dt>
              <dd>{config.chainId}</dd>
            </div>
            <div>
              <dt>Gas token</dt>
              <dd>ETH</dd>
            </div>
          </dl>
          <a className="text-link" href={config.explorerUrl} target="_blank" rel="noreferrer">
            Open network explorer <ArrowUpRight size={15} />
          </a>
        </Modal>
      )}
    </>
  );
}

export function Shell({ config, children }: { config: AppConfig; children: ReactNode }) {
  return (
    <WalletProvider config={config}>
      <div className="app-shell">
        <Header config={config} />
        <main>{children}</main>
        <footer>
          <Link href="/" className="footer-brand">
            StockSwap <span>Swap stock exposure.</span>
          </Link>
          <div>
            <a href="/explore">
              Asset disclosures <ArrowUpRight size={12} />
            </a>
            <a href="https://docs.robinhood.com/chain/" target="_blank" rel="noreferrer">
              Network docs <ArrowUpRight size={12} />
            </a>
            <span className="footer-status">
              <span className="network-dot" />
              {config.testnet ? 'Testnet environment' : 'Mainnet environment'}
            </span>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
