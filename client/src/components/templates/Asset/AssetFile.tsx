import React, { PureComponent } from 'react'
import { Logger, DDO, File } from '@oceanprotocol/squid'
import filesize from 'filesize'
import Button from '../../atoms/Button'
import Spinner from '../../atoms/Spinner'
import { User } from '../../../context'
import styles from './AssetFile.module.scss'
import ReactGA from 'react-ga'
import cleanupContentType from '../../../utils/cleanupContentType'

export const messages = {
    start: 'Decrypting file URL...',
    0: '1/3<br />Asking for agreement signature...',
    1: '1/3<br />Agreement initialized.',
    2: '2/3<br />Asking for two payment confirmations...',
    3: '2/3<br />Payment confirmed. Requesting access...',
    4: '3/3<br /> Access granted. Consuming file...'
}

interface AssetFileProps {
    file: File
    ddo: DDO
}

interface AssetFileState {
    isLoading: boolean
    error: string
    step: number | null
}

export default class AssetFile extends PureComponent<
    AssetFileProps,
    AssetFileState
> {
    public state = {
        isLoading: false,
        error: '',
        step: null
    }

    private resetState = () =>
        this.setState({
            isLoading: true,
            error: '',
            step: null
        })

    private purchaseAsset = async (ddo: DDO, index: number) => {
        this.resetState()

        ReactGA.event({
            category: 'Purchase',
            action: 'purchaseAsset-start ' + ddo.id
        })

        const { ocean } = this.context

        try {
            const accounts = await ocean.accounts.list()
            const service = ddo.findServiceByType('Access')

            const agreements = await ocean.keeper.conditions.accessSecretStoreCondition.getGrantedDidByConsumer(accounts[0].id)
            const agreement = agreements.find((element: any) => {return element.did === ddo.id})

            let agreementId
            if (agreement) {
                agreementId = agreement.agreementId
            } else {
                agreementId = await ocean.assets
                .order(ddo.id, service.serviceDefinitionId, accounts[0])
                .next((step: number) => this.setState({ step }))
            }

            // manually add another step here for better UX
            this.setState({ step: 4 })

            const path = await ocean.assets.consume(
                agreementId,
                ddo.id,
                service.serviceDefinitionId,
                accounts[0],
                '',
                index
            )
            Logger.log('path', path)
            ReactGA.event({
                category: 'Purchase',
                action: 'purchaseAsset-end ' + ddo.id
            })
            this.setState({ isLoading: false })
        } catch (error) {
            Logger.log('error', error.message)
            this.setState({
                isLoading: false,
                error: `${error.message}. Sorry about that, can you try again?`
            })
            ReactGA.event({
                category: 'Purchase',
                action: 'purchaseAsset-error ' + error.message
            })
        }
    }

    public render() {
        const { ddo, file } = this.props
        const { isLoading, error, step } = this.state
        const { isLogged, isOceanNetwork } = this.context
        const { index, contentType, contentLength } = file

        return (
            <div className={styles.fileWrap}>
                <ul key={index} className={styles.file}>
                    {contentType || contentLength ? (
                        <>
                            <li>
                                {contentType && cleanupContentType(contentType)}
                            </li>
                            <li>
                                {contentLength && contentLength > 0
                                    ? filesize(contentLength)
                                    : ''}
                            </li>
                            {/* <li>{encoding}</li> */}
                            {/* <li>{compression}</li> */}
                        </>
                    ) : (
                        <li className={styles.empty}>No file info available</li>
                    )}
                </ul>

                {isLoading ? (
                    <Spinner
                        message={
                            step === null ? messages.start : messages[step]
                        }
                    />
                ) : (
                    <Button
                        primary
                        className={styles.buttonMain}
                        // weird 0 hack so TypeScript is happy
                        onClick={() => this.purchaseAsset(ddo, index || 0)}
                        disabled={!isLogged || !isOceanNetwork}
                    >
                        Get file
                    </Button>
                )}

                {error !== '' && <div className={styles.error}>{error}</div>}
            </div>
        )
    }
}

AssetFile.contextType = User
