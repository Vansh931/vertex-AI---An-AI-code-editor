import React, { useEffect } from 'react'

import { getMe } from './features/me'
import { useDispatch } from 'react-redux'
import { setUserdata } from './redux/userSlice'
import Dashboard from './pages/Dashboard'
import {BrowserRouter, Route, Routes} from "react-router-dom"
import ProjectPage from './pages/ProjectPage'
import Plans from './components/Plans'
function App() {
  const dispatch=useDispatch()
  useEffect(()=>{
const getUser=async () => {
  try {
    const data=await getMe()
    console.log(data)
    dispatch(setUserdata(data))
  } catch (error) {
    console.log(error)
  }
}
getUser()
  },[])
  return (
   <BrowserRouter>
   <Routes>
    <Route path='/project/:id' element={<ProjectPage/>} />
    <Route path='/' element={<Dashboard/>}/>
    <Route path='/plans' element={<Plans/>}/>
   </Routes>
   </BrowserRouter>
  )
}

export default App
