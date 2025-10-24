/**
 * AR Test Page
 * Simple test page to verify AR components work independently
 */

import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function ARTest() {
  const [testResults, setTestResults] = useState({});

  const runTest = async (testName, testFn) => {
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, result } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }));
    }
  };

  const tests = {
    'Device Capabilities API': async () => {
      const response = await fetch('/api/ar/capabilities?userAgent=test&screenWidth=1920&screenHeight=1080&pixelRatio=1');
      const data = await response.json();
      return data.assessment ? 'Capabilities API working' : 'No assessment returned';
    },
    
    'AR Message API': async () => {
      const response = await fetch('/api/ar/message');
      const data = await response.json();
      return data.content?.text ? 'Message API working' : 'No message content';
    },
    
    'QR Code API': async () => {
      const response = await fetch('/api/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://test.com' })
      });
      const data = await response.json();
      return data.qrCodeDataUrl ? 'QR API working' : 'No QR code generated';
    },
    
    'Session Hook': async () => {
      // Test if useSession hook is available
      return typeof require('../lib/session').useSession === 'function' ? 'Session hook available' : 'Session hook missing';
    }
  };

  return (
    <>
      <Head>
        <title>AR Test Page - Component Validation</title>
      </Head>
      
      <Layout>
        <div className="test-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#8b0000', marginBottom: '2rem' }}>🧛‍♂️ AR Component Test Suite</h1>
          
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            This page tests the core AR components and APIs to verify everything is working correctly.
          </p>

          <div className="test-controls" style={{ marginBottom: '2rem' }}>
            <button 
              onClick={() => Object.keys(tests).forEach(testName => runTest(testName, tests[testName]))}
              style={{
                background: '#8b0000',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Run All Tests
            </button>
          </div>

          <div className="test-results">
            {Object.keys(tests).map(testName => {
              const result = testResults[testName];
              return (
                <div 
                  key={testName}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: result ? (result.success ? '#d4edda' : '#f8d7da') : '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>{testName}</h3>
                    <button
                      onClick={() => runTest(testName, tests[testName])}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Test
                    </button>
                  </div>
                  
                  {result && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Status:</strong> 
                      <span style={{ color: result.success ? '#155724' : '#721c24', marginLeft: '0.5rem' }}>
                        {result.success ? '✅ Pass' : '❌ Fail'}
                      </span>
                      
                      {result.success && result.result && (
                        <div style={{ marginTop: '0.5rem', color: '#155724' }}>
                          <strong>Result:</strong> {result.result}
                        </div>
                      )}
                      
                      {!result.success && result.error && (
                        <div style={{ marginTop: '0.5rem', color: '#721c24' }}>
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="navigation" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <a href="/" style={{ color: '#8b0000', textDecoration: 'none', marginRight: '1rem' }}>
              ← Back to Homepage
            </a>
            <a href="/ar" style={{ color: '#8b0000', textDecoration: 'none' }}>
              Go to AR Experience →
            </a>
          </div>
        </div>
      </Layout>
    </>
  );
}