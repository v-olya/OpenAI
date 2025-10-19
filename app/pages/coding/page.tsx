import { Chat } from '../../components/chat/chat';
import Panel from '../../components/left-panel/panel';
import PresetList from '../../components/left-panel/preset-list';

const Coding = () => {
    return (
        <main className='container'>
            <Panel>
                <h2>Analyze files and write code with AI</h2>
                <br />
                <PresetList type='coding' />
                <br />
                <p className='emphasis'>or anything else...</p>
            </Panel>

            <Chat chatType='coding' />
        </main>
    );
};

export default Coding;
