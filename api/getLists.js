module.exports = async (req, res) => {
  try {
    // This is a simple implementation that returns hard-coded list info
    // In a production environment, this could scan a directory or database
    const lists = [
      { id: 'dolch-k', name: 'Dolch Kindergarten' },
      { id: 'dolch-1', name: 'Dolch First Grade' },
      { id: 'dolch-2', name: 'Dolch Second Grade' },
      { id: 'dolch-3', name: 'Dolch Third Grade' },
      { id: 'dolch-n', name: 'Dolch Nouns' }
    ];
    
    res.json({ lists });
  } catch (error) {
    console.error('Error in getLists API:', error);
    res.status(500).json({ error: 'Failed to get spelling lists' });
  }
};
