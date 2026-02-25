import './app.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LauncherView from './views/LauncherView.jsx';
import CreateModelView from './views/CreateModelView.jsx';
import TaggerView from './views/TaggerView.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LauncherView />} />
        <Route path="/create-model" element={<CreateModelView />} />
        <Route path="/edit-model/:modelName" element={<CreateModelView />} />
        <Route path="/tagger/:fileName/:modelName" element={<TaggerView />} />
      </Routes>
    </Router>
  )
}

export default App;