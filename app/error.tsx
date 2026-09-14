'use client';
export default function Error({reset}:{reset:()=>void}){return <section className='empty-state'><h1>A connection went off course.</h1><p>We couldn’t load this page. Please try again.</p><button className='primary-button inline-button' onClick={reset}>Try again</button></section>;}
