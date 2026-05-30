import { useState } from 'react';
import { FaArrowLeft, FaSearch, FaWifi } from 'react-icons/fa';
import styles from './TapHistoryPage.module.css';

export default function TapHistoryPage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const demoTaps = [
    { id: '1', terminal: 'Victoria Island Terminal', time: '9:41 AM', amount: 150, status: 'success', date: 'Today' },
    { id: '2', terminal: 'Lekki Expressway Bus Stop', time: '7:20 AM', amount: 100, status: 'success', date: 'Today' },
    { id: '3', terminal: 'Yaba Metro Station', time: '6:15 PM', amount: 100, status: 'success', date: 'Yesterday' },
    { id: '4', terminal: 'Ikeja Bus Terminal', time: '4:10 PM', amount: 200, status: 'success', date: 'Yesterday' },
    { id: '5', terminal: 'CMS Marina', time: '8:10 AM', amount: 150, status: 'success', date: 'Yesterday' },
  ];

  const filters = ['All', 'Today', 'This Week', 'This Month', 'Custom'];

  const groupedTaps = {};
  demoTaps.forEach(tap => {
    if (!groupedTaps[tap.date]) {
      groupedTaps[tap.date] = [];
    }
    groupedTaps[tap.date].push(tap);
  });

  const filteredTaps = demoTaps.filter(tap =>
    tap.terminal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Tap History</h1>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <FaSearch size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search terminal..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className={styles.filterChips}>
        {filters.map(filter => (
          <button
            key={filter}
            className={`${styles.chip} ${activeFilter === filter.toLowerCase() ? styles.chipActive : ''}`}
            onClick={() => setActiveFilter(filter.toLowerCase())}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Taps Grouped by Date */}
      <div className={styles.tapsList}>
        {Object.entries(groupedTaps).map(([date, taps]) => (
          <div key={date}>
            <p className={styles.dateGroup}>{date} — May 30, 2025</p>
            {taps.map(tap => (
              <div key={tap.id} className={styles.tapRow}>
                <div className={styles.tapIcon}>
                  <FaWifi />
                </div>
                <div className={styles.tapInfo}>
                  <p className={styles.tapTerminal}>{tap.terminal}</p>
                  <p className={styles.tapTime}>{tap.time}</p>
                </div>
                <div className={styles.tapRight}>
                  <p className={styles.tapAmount}>-₦{tap.amount.toLocaleString('en-NG')}</p>
                  <span className={styles.statusBadge}>Success</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <button className={styles.loadMoreBtn}>Load More</button>
    </>
  );
}
