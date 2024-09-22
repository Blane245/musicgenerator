import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './App.css';
import "./new.css"
import Body from './layouts/body';
import Footer from './layouts/footer';
import Header from './layouts/header';
import { Message } from './types/types';
import CGMFile from './classes/cgmfile';
import TimeLine from './classes/timeline';
import { AudioPlayerProvider } from './components/panels/audioplayercontext';

function App() {

  const [message, setMessage] = useState<Message>({ error: false, text: 'startup' })
  const [status, setStatus] = useState<string>('')
  const [fileContents, setFileContents] = useState<CGMFile | null>(null);
  const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));

  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
      <AudioPlayerProvider>
        <div className='page'>
          <div className='page-grid'>
            <Header
              appName='Computer Music Generator'
              appVersion={import.meta.env.PACKAGE_VERSION}
              appIcon='./src/images/CGM.svg'
              message={message}
              setFileContents={setFileContents}
              fileContents={fileContents}
              setMessage={setMessage}
              setStatus={setStatus}
              timeLine={timeLine}
              setTimeLine={setTimeLine}
            />
            <Body
              setMessage={setMessage}
              setStatus={setStatus}
              fileContents={fileContents}
              setFileContents={setFileContents}
              timeLine={timeLine}
            />
            <Footer
              status={status}
            />
          </div>
        </div>
      </AudioPlayerProvider>

    </>
  )
}

export default App
