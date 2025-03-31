module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // This is a simple implementation that returns hard-coded list info
    // In a production environment, this could scan a directory or database
    const lists = [
      { id: 'dolch-k', name: 'Dolch Kindergarten' },
      { id: 'dolch-1', name: 'Dolch First Grade' },
      { id: 'dolch-2', name: 'Dolch Second Grade' },
      { id: 'dolch-3', name: 'Dolch Third Grade' },
      { id: 'dolch-n', name: 'Dolch Nouns' },
      { id: 'evie-1', name: 'Evie\'s Challenge Words' },
      { id: 'tgtb-4a', name: 'TGTB Language 4 Spelling List A' },
      { id: 'tgtb-4b', name: 'TGTB Language 4 Spelling List B' },
      { id: 'tgtb-4c', name: 'TGTB Language 4 Spelling List C' },
      { id: 'tgtb-4d', name: 'TGTB Language 4 Spelling List D' }
    ];
    
    res.json({ lists });
  } catch (error) {
    console.error('Error in getLists API:', error);
    res.status(500).json({ error: 'Failed to get spelling lists' });
  }
};
