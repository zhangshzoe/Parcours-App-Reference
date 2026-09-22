import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Parcours · 多语言学习之路',description:'支持法语、英语和德语切换的分级场景课程、双语学习、听说读写练习与个人复习。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
