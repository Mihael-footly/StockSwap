import Link from 'next/link';
export default function NotFound(){return <section className='empty-state'><h1>Nothing on this route.</h1><p>This page or verified asset could not be found.</p><Link className='primary-button inline-button' href='/'>Back to swapping →</Link></section>;}
