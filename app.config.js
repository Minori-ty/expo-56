import pkg from './package.json' with { type: 'json' }

const config = {
    expo: {
        name: pkg.name,
        slug: pkg.name,
        version: pkg.version,
        orientation: 'portrait',
        icon: './assets/images/icon.png',
        scheme: 'expo56',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        ios: {
            icon: './assets/expo.icon',
            supportsTablet: true,
            bundleIdentifier: 'com.minority.expo56',
        },
        android: {
            adaptiveIcon: {
                backgroundColor: '#E6F4FE',
                foregroundImage: './assets/images/android-icon-foreground.png',
                backgroundImage: './assets/images/android-icon-background.png',
                monochromeImage: './assets/images/android-icon-monochrome.png',
            },
            predictiveBackGestureEnabled: false,
            permissions: ['READ_CALENDAR', 'WRITE_CALENDAR'],
            package: 'com.minority.expo56',
        },
        web: {
            bundler: 'metro',
            output: 'static',
            favicon: './assets/images/favicon.png',
        },
        plugins: [
            'expo-router',
            [
                'expo-splash-screen',
                {
                    backgroundColor: '#208AEF',
                    android: {
                        image: './assets/images/splash-icon.png',
                        imageWidth: 76,
                    },
                },
            ],
            [
                'expo-sqlite',
                {
                    enableFTS: true,
                    useSQLCipher: true,
                    android: {
                        // Override the shared configuration for Android
                        enableFTS: false,
                        useSQLCipher: false,
                    },
                    ios: {
                        // You can also override the shared configurations for iOS
                        customBuildFlags: ['-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1'],
                    },
                },
            ],
            [
                'expo-calendar',
                {
                    calendarPermission: '申请获取日历权限，以便添加动漫更新事件',
                    remindersPermission: '该应用需要访问您的提醒事项。',
                    writeOnlyCalendarPermission: '该应用需要向您的日历添加事件。',
                    writeOnlyAccess: false,
                },
            ],
            [
                'expo-build-properties',
                {
                    android: {
                        buildArchs: ['arm64-v8a'],
                    },
                },
            ],
            [
                'expo-status-bar',
                {
                    backgroundColor: '#ffffff',
                    translucent: true,
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
        extra: {
            eas: {
                projectId: '382a0b40-4626-431f-b71b-f3b0c09b9f13',
            },
        },
    },
}
export default config
