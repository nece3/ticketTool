import './App.css'
import { PageBody } from './modules/PCForm'

function App() {
  return (
  <div className="main-content">
    <h1 className="msr_h103">秘密決定ツール</h1>
    <h2 className="msr_h203">概要</h2>
    シノビガミ「ドリーム・チケット」のGM用ツールです。<br/>
    PCの秘密の状態に合わせて以下を編集したのち、<br/>
    「候補表示」ボタンを押すとNPCの秘密候補を表示します。
    <hr/>
    <PageBody/>
  </div>
  )
}

export default App
