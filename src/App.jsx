import './style/general.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LauncherView from './views/LauncherView.jsx';
import CreateModelView from './views/CreateModelView.jsx';
import TaggerView from './views/TaggerView.jsx';
import TextCreatorView from './views/TextCreatorView.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LauncherView />} />
        <Route path="/create-model" element={<CreateModelView />} />
        <Route path="/edit-model/:modelName" element={<CreateModelView />} />
        <Route path="/tagger/:projectName/:fileName/:modelName" element={<TaggerView />} />
        <Route path="/text-creator" element={<TextCreatorView />} />
      </Routes>
    </Router>
  )
}

export default App;