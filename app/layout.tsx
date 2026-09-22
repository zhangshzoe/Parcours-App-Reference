import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Parcours · 法语进阶之路',description:'覆盖 A1–C2 的法语分级场景课程、听说读写练习与个人复习。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
