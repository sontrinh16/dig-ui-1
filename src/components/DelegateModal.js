import { InputNumber, message, notification, Checkbox } from "antd"
import { delegate } from "../helpers/transaction"
import { useEffect, useState } from 'react'
import { Form } from "react-bootstrap";
import { getKeplr, getStargateClient } from "../helpers/getKeplr";
import { makeMsgBeginRedelegate, makeSignDocDelegateMsg, makeDelegateMsg, makeSendMsg, makeSignDocSendMsg, makeSendMsgcTemp } from "../helpers/ethereum/lib/eth-transaction/Msg"
import { broadcastTransaction } from "../helpers/ethereum/lib/eth-broadcast/broadcastTX"
import { getWeb3Instance } from "../helpers/ethereum/lib/metamaskHelpers";
import ClipLoader from "react-spinners/ClipLoader"
import { getBalance } from "../helpers/getBalances";

const style = {
    transfer: {
        marginBottom: '2rem',
        width: '100%',
        marginTop: '1rem',
        padding: 20,
        backgroundColor: '#1f1f1f',
        borderRadius: '20px',
        border: 'solid 1px #bdbdbd'
    },
    transferInfo: {
        padding: '50px',
        borderRadius: '10px',
        width: '20rem'
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'end',
        marginTop: '2rem',
        marginBottom: '1rem'
    },
    formInput: {
        backgroundColor: '#1f1f1f',
        color: '#bdbdbd',
        borderRadius: '10px',
    },
    formTitle: {
        fontFamily: 'ubuntu',
        color: '#ffac38',
        fontWeight: 500
    }
}

const DelegateModal = ({ validators, wrapSetter, defaultVal }) => {
    const [value, setValue] = useState('')
    const [delegators, setDelegators] = useState([])
    const [selectVal, setSelectVal] = useState(defaultVal)
    const [selectDel, setSelectDel] = useState(0)
    const [showAdvance, setShowAdvance] = useState(false)
    const [gasAmount, setGasAmount] = useState('200000')
    const [isDoingTX, setIsDoingTx] = useState(false)
    const [availabeAmount, setAvailableAmount] = useState('')

    useEffect(() => {
        (async () => {
            setDelegators([...JSON.parse(localStorage.getItem('accounts'))])
            const delegatorsList = JSON.parse(localStorage.getItem('accounts'))
            if(delegatorsList.length > 0) {
                await getAvailableAmount(delegatorsList)
            }
        })()
    }, [selectDel])

    const success = () => {
        notification.success({
            message: 'Transaction sent',
            duration: 1
        })
    };

    const error = (message) => {
        notification.error({
            message: 'Delegate failed',
            description: message
        })
    };

    const handleChange = (value) => {
        setValue(value)
    }

    const checkDisable = () => {
        if (value === 0 || value === '' || delegators.length === 0) {
            return true
        }
        return false
    }
    const handleChangeSelect = (e) => {
        setSelectDel(e.target.value)
    }

    const handleChangeSelectVal = (e) => {
        setSelectVal(e.target.value)
    }

    const check = (e) => {
        setShowAdvance(e.target.checked)
    }

    const handleChangeGas = (value) => {
        setGasAmount(value)
    }

    const getAvailableAmount = async (delegators) => {
        const address = delegators[selectDel].type === 'keplr' ? delegators[selectDel].account.address : delegators[selectDel].account
        const balance = await getBalance(address)
        const balanceAmount = balance.length > 0 ? balance[0][0].amount : 0
        setAvailableAmount(balanceAmount)
    }

    const handleClick = async () => {
        setIsDoingTx(true)
        if (delegators[selectDel].type === 'keplr') {
            const { offlineSigner } = await getKeplr();

            const stargate = await getStargateClient(offlineSigner)
            if (stargate != null) {
                const amount = value * 1000000
                const recipient = validators[selectVal].operator_address
                const gas = parseInt(gasAmount)
                delegate(stargate, delegators[selectDel].account.address, amount, recipient, gas).then(() => {
                    setIsDoingTx(false)
                    success()
                    wrapSetter(false)
                }).catch((e) => {
                    setIsDoingTx(false)
                    error(e.message)
                    wrapSetter(false)
                    console.log(e)
                })
            }
        }
        else {
            //makeSignDocDelegateMsg, makeDelegateMsg
            // please set enviroment variable: DENOM, etc
            //import web3
            let web3 = await getWeb3Instance();
            const denom = process.env.REACT_APP_DENOM
            const chainId = process.env.REACT_APP_CHAIN_ID
            const memo = "Love From Dev Team"

            const address = delegators[selectDel].account
            const gasLimit = parseInt(gasAmount)


            const recipient = validators[selectVal].operator_address
            const amount = value * 1000000

            if (amount == 0) {
                window.alert("Plese check your amount")
                return
            }
            const msgDelegate = makeDelegateMsg(address, recipient, amount, denom)
            const signDocDelegate = makeSignDocDelegateMsg(address, recipient, amount, denom)

            console.log("address", address)

            const UIProcessing = function () {
                setIsDoingTx(false)
                wrapSetter(false)
            }
            broadcastTransaction(address, msgDelegate, signDocDelegate, chainId, memo, gasLimit, web3, UIProcessing).then(() => {
                // wrapSetter(false)
                // setIsDoingTx(false)
                // success()
            }).catch((e) => {
                wrapSetter(false)
                setIsDoingTx(false)
                error(e.message)
            })
        }
    }

    return (
        <div>
            <div style={style.transfer}>
                <p style={style.formTitle}>Delegator</p>
                <>
                    <Form.Select onChange={handleChangeSelect} defaultValue={selectDel} style={style.formInput}>
                        {
                            delegators.map((delegator, index) => (
                                <option key={index} value={index}>{delegator.type === 'keplr' ? delegator.account.address : delegator.account}</option>
                            ))
                        }
                    </Form.Select>
                </>
            </div>
            <div style={style.transfer}>
                <p style={style.formTitle}>Validator</p>
                <>
                    <Form.Select onChange={handleChangeSelectVal} defaultValue={selectVal} style={style.formInput}>
                        {
                            validators.map((val, index) => (
                                <option key={index} value={index}>{val.description.moniker} ({`${val.commission.commission_rates.rate * 100}%`})</option>
                            ))
                        }
                    </Form.Select>
                </>
            </div>
            <div style={style.transfer}>
                <p style={style.formTitle}>Amount Availabe</p>
                <p style={{ ...style.formInput, border: 'solid 1px #bdbdbd', padding: 10 }}>
                    {parseInt(availabeAmount) / 1000000 || 0} DIG
                </p>
                <div style={{ marginBottom: '1rem', ...style.formTitle }}>Amount To Stake</div>
                <>
                    <InputNumber style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '10px',
                        border: `2px solid #c4c4c4`,
                        fontSize: '1rem',
                        paddingTop: '0.2rem',
                        backgroundColor: '#1f1f1f',
                        color: '#F6F3FB'
                    }} min={0} max={parseInt(availabeAmount)/1000000} step={0.000001} onChange={handleChange} />
                </>
            </div>
            <div>
                <Checkbox onChange={check} style={{ color: '#F6F3FB', fontSize: '1.2rem', fontFamily: 'Ubuntu' }}>Advance</Checkbox>
            </div>
            {
                showAdvance && (
                    <div style={style.transfer}>
                        <div style={{ marginBottom: '1rem', ...style.formTitle }}>Set Gas</div>
                        <>
                            <InputNumber style={{
                                width: '100%',
                                height: '40px',
                                borderRadius: '10px',
                                border: `2px solid #c4c4c4`,
                                fontSize: '1rem',
                                paddingTop: '0.2rem',
                                backgroundColor: '#1f1f1f',
                                color: '#F6F3FB'
                            }} min={0} step={1} onChange={handleChangeGas} defaultValue={parseInt(gasAmount)} />
                        </>
                    </div>
                )
            }
            {
                isDoingTX && (
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', fontSize: '1rem' }}>
                        <ClipLoader style={{ marginTop: '5em' }} color={'#f0a848'} loading={isDoingTX} />
                    </div>
                )
            }
            <div style={style.button}>
                <button onClick={() => wrapSetter(false)} style={{ border: 0, borderRadius: '10px', width: '20%', height: '2.5rem', fontSize: '1rem', backgroundColor: '#838089', color: '#F6F3FB', fontFamily: 'ubuntu', marginRight: '20px' }}>
                    Cancel
                </button>
                <button disabled={checkDisable()} onClick={handleClick} style={{ border: 0, borderRadius: '10px', width: '20%', height: '2.5rem', fontSize: '1rem', backgroundColor: '#ffac38', color: '#F6F3FB', fontFamily: 'ubuntu' }}>
                    Send
                </button>
            </div>
        </div>
    )
}

export default DelegateModal