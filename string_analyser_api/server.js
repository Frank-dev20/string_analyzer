// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log('String Analyzer API is running');
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('\nAvailable endpoints:');
    console.log(`  POST   /strings`);
    console.log(`  GET    /strings/:string_value`);
    console.log(`  GET    /strings?filters...`);
    console.log(`  GET    /strings/filter-by-natural-language?query=...`);
    console.log(`  DELETE /strings/:string_value`);
    console.log('\nPress Ctrl+C to stop\n');
    
})