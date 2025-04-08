import { Stack, Tabs } from 'expo-router'
import React from 'react'
import TabBar from '../../components/TabBar'


const Layout = () => {
    return (
        <Tabs tabBar={props => <TabBar {...props}/>} screenOptions={{headerShown: false,}}>
            <Tabs.Screen
            name="home"
            options={{
                title: 'Home',
            }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: 'Create',
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                }}
            />
        </ Tabs>

    )
}

export default Layout;
