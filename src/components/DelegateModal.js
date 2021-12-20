import { InputNumber, message, Select } from "antd"
import { transaction, delegate } from "../helpers/transaction"
import { useEffect, useState } from 'react'
import { Form } from "react-bootstrap";
import { getBalance } from "../helpers/getBalances";
import { getKeplr, getCosmosClient } from "../helpers/getKeplr";

const style = {
    transfer: {
        marginBottom: '2rem',
        width: '100%',
        marginTop: '1rem'
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
        flexDirection: 'column',
        justifyContent: 'center',
        marginTop: '2rem',
        marginBottom: '2rem'
    }
}

const defaultAddress = 'osmo1vxgcyq7nc8d8gykhwf35e4z0l04xhn4fq456uj'

const DelegateModal = ({ validators, wrapSetter, defaultVal}) => {
    const [value, setValue] = useState('')
    const [delegators, setDelegators] = useState([])
    const [selectVal, setSelectVal] = useState(defaultVal)
    const [selectDel, setSelectDel] = useState(0)

    useEffect(() => {
        (async () => {
            setDelegators([...JSON.parse(localStorage.getItem('accounts'))])
        })()
    }, [])

    const success = () => {
        message.success('Deposit success', 1);
    };

    const error = () => {
        message.error('Deposit failed', 1);
    };

    const handleChange = (value) => {
        setValue(value)
    }

    const checkDisable = () => {
        if (value === 0) {
            return true
        }
        return false
    }

    const handleChangeSelect = (value) => {
        console.log(value)
        setSelectDel(value)
    }

    const handleChangeSelectVal = (value) => {
        setSelectVal(value)
    }

    const handleClick = async () => {
        const { offlineSigner } = await getKeplr();
        const cosmJS = getCosmosClient(delegators[selectDel].address, offlineSigner);
        if (cosmJS != null) {
            const amount = value*1000000
            const recipient = validators[selectVal].operator_address
            delegate(cosmJS, amount ,recipient).then(data => {
                success()
                wrapSetter(false)
            }).catch((e) => {
                error()
                wrapSetter(false)
                console.log(e)
            })
        }
    }

    return (
        <div>
            <div style={style.transfer}>
                <p>Delegator</p>
                <>
                    <Form.Select onChange={handleChangeSelect} defaultValue={selectDel}>
                        {
                            delegators.map((delegator, index) => (
                                <option value={index}>{delegator.address}</option>
                            ))
                        }
                    </Form.Select>
                </>
            </div>
            <div style={style.transfer}>
                <>
                    <Form.Select onChange={handleChangeSelectVal} defaultValue={selectVal}>
                        {
                            validators.map((val, index) => (
                                <option value={index}>{val.description.moniker} ({`${val.commission.commission_rates.rate * 100}%`})</option>
                            ))
                        }
                    </Form.Select>
                </>
            </div>
            <div>
                <div style={{ marginBottom: '1rem' }}>Amount To Stake</div>
                <>
                    <InputNumber style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '10px',
                        border: `2px solid #c4c4c4`,
                        fontSize: '1rem',
                        paddingTop: '0.2rem'
                    }} min={0} step={0.01} onChange={handleChange} />
                </>
            </div>
            <div style={style.button}>
                <button disabled={checkDisable()} onClick={handleClick} style={{ borderRadius: '10px', height: '4rem', fontSize: '1.5rem', backgroundColor: '#9b8da6', color: '#ffffff' }}>
                    Delegate
                </button>
            </div>
        </div>
    )
}

export default DelegateModal