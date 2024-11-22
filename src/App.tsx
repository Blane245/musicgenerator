import { Helmet } from 'react-helmet-async';
import './App.css';
import Body from './components/layouts/body';
import Footer from './components/layouts/footer';
import Header from './components/layouts/header';
import { useCMGContext } from './contexts/cmgcontext';

export default function App() {
  const {setMouseDown} = useCMGContext();

  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
        <div className='page'
        id='page'
        onMouseUp={()=>setMouseDown(false)}
        >
          <div className='page-grid'>
            <Header
              appName='Computer Music Generator'
              appVersion={import.meta.env.PACKAGE_VERSION}
            />
            <Body />
            <Footer />
          </div>
        </div>

    </>
  )
}
