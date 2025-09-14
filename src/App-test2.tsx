import React, { useState } from 'react';
import { SystemModel } from './models/SystemModel';

function App() {
  const [model] = useState<SystemModel>(new SystemModel());

  return (
    <div style={{ padding: '20px' }}>
      <h1>System Dynamics Modeler - Test 2</h1>
      <p>If you can see this, the SystemModel import is working!</p>
      <p>Model has {model.stocks.size} stocks and {model.flows.size} flows</p>
    </div>
  );
}

export default App;