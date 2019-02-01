import { Logger } from '@oceanprotocol/squid'
import queryString from 'query-string'
import React, { Component } from 'react'
import { User } from '../context/User'

interface IState {
    ddo: any,
    metadata: any
}

interface IProps {
    location: any,
    match: any
}

class Details extends Component<IProps, IState>  {

    public state = { ddo: null, metadata: null }

    public async componentDidMount() {
        const ddo = await this.context.ocean.resolveDID(this.props.match.params.did)
        const { metadata } = ddo.findServiceByType('Metadata')
        this.setState({ddo, metadata})
    }

    public render() {
        return (
            <>
                {this.state.metadata ? (this.showDetails(this.state.ddo)): (<div>Loading</div>)}
            </>
        )
    }

    private purchaseAsset = async (ddo: any) => {
        const account = await this.context.ocean.getAccounts()
        const service = ddo.findServiceByType('Access')
        const serviceAgreementSignatureResult: any = await this.context.ocean
            .signServiceAgreement(
                ddo.id,
                service.serviceDefinitionId,
                account[0])
        Logger.log('serviceAgreementSignatureResult', serviceAgreementSignatureResult)

        await this.context.ocean
            .initializeServiceAgreement(
                ddo.id,
                service.serviceDefinitionId,
                serviceAgreementSignatureResult.serviceAgreementId,
                serviceAgreementSignatureResult.serviceAgreementSignature,
                (files: any) => Logger.log(`Got files, first files length in bytes: ${files[0].length}`),
                account[0],
            )
    }

    private showDetails = (ddo: any) => {
        return (
            <>
                <div>{JSON.stringify(this.state.metadata)}</div>
                <button onClick={this.purchaseAsset.bind(this, ddo)}>Purchase asset</button>
            </>
        )
    }
}

Details.contextType = User
export default Details