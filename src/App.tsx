import { Helmet } from 'react-helmet-async';
import './App.css';
import Body from './components/layouts/body';
import Footer from './components/layouts/footer';
import Header from './components/layouts/header';

export default function App() {

  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
        <div className='page'>
          <div className='page-grid'>
            <Header
              appName='Computer Music Generator'
              appVersion={import.meta.env.PACKAGE_VERSION}
              appIcon='./src/images/CGM.svg'
            />
            <Body />
            <Footer />
          </div>
        </div>

    </>
  )
}
