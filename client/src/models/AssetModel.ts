import { MetaData } from '@oceanprotocol/squid'

const AssetModel: MetaData = {
    // OEP-08 Attributes
    // https://github.com/oceanprotocol/OEPs/tree/master/8
    main: {
        type: 'dataset',
        name: '',
        dateCreated: '',
        author: '',
        license: '',
        price: '',
        files: [],
        marketAddress: ''
    },
    additionalInformation: {
        description: '',
        copyrightHolder: '',
        categories: []
    }
}

export default AssetModel
