module.exports = [
    'api/index',
    'api/globals',
    {
        type: 'category',
        label: 'Classes',
        items: [
            'api/classes/cacheerror',
            'api/classes/cacherecord',
            'api/classes/cachewrapper',
            'api/classes/valueerror',
        ],
    },
    {
        type: 'category',
        label: 'Interfaces',
        items: [
            'api/interfaces/cacheobject',
            'api/interfaces/cacheoptions',
            'api/interfaces/cachewrapperoptions',
        ],
    },
]
