const stringStore = new Map();

function addString(value, properties){
    const id = properties.sha256_hash;

    if(stringStore.has(id)){
        const error = new Error('Error: This string already exist')
        error.statusCode = 409;
        throw error;
    }

    const stringData = {
    id: id,
    value: value,
    properties: properties,
    created_at: new Date().toISOString()
  };

  stringStore.set(id, stringData);
  
  return stringData;
}

function getStringByValue(value){
    for (const [id, stringData] of stringStore.entries()) {
        if (stringData.value === value) {
            return stringData;
        }
    }
    return null;
}

function getAllString(){
    return Array.from(stringStore.values());
}

function deleteStringByValue(value){
    for (const [id, stringData] of stringStore.entries()) {
        if (stringData.value === value) {
            return stringStore.delete(id);
        }
    }
  
    return false; 
}


function getCount() {
  return stringStore.size;
}

function clearAll() {
  stringStore.clear();
}


module.exports = {
  addString,
  getStringByValue,
  getAllString,
  deleteStringByValue,
  getCount,
  clearAll
};