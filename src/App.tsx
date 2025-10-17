// src/App.tsx
import { useState, useEffect } from 'react';
import './App.css'; // We'll add styles here

// Define a type for our bill object for better code quality
type Bill = {
  bill_id: number;
  number: string;
  title: string;
  last_action_date: string;
  last_action: string;
  url: string;
};

function App() {
  // State variables to hold our data and manage the UI
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // This effect runs once when the component first loads
  useEffect(() => {
    const fetchBills = async () => {
      try {
        // Fetch data from our own backend worker!
        const response = await fetch('/api/bills');
        if (!response.ok) {
          throw new Error('Failed to fetch bills from the server.');
        }
        const data: Bill[] = await response.json();
        setBills(data);
        setFilteredBills(data);
      } catch (err) {
        setError('Could not load data. Try running a sync at /api/sync first.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []); // The empty array [] means this runs only once

  // This effect runs whenever the search term changes
  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const results = bills.filter(bill =>
      bill.title.toLowerCase().includes(lowercasedTerm) ||
      bill.number.toLowerCase().includes(lowercasedTerm)
    );
    setFilteredBills(results);
  }, [searchTerm, bills]); // This runs whenever searchTerm or bills changes

  return (
    <div className="container">
      <header>
        <h1>Legislative Monitor</h1>
        <p>Tracking legislation relevant to the public policy team.</p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by title or bill number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p>Loading legislation...</p>}
      {error && <p className="error">{error}</p>}

      <div className="bill-list">
        {!loading && !error && filteredBills.map(bill => (
          <div key={bill.bill_id} className="bill-card">
            <h3>{bill.number}: {bill.title}</h3>
            <p><strong>Last Action:</strong> {bill.last_action}</p>
            <p><strong>Date:</strong> {bill.last_action_date}</p>
            <a href={bill.url} target="_blank" rel="noopener noreferrer">
              View on LegiScan
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;