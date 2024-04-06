import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import App from './App.jsx'
import './index.css'
import Main from "./pages/main.jsx";
import CreateData from "./pages/CreateData.jsx";
import NNtrain from "./pages/NNtrain.jsx";
import Matrix from "./pages/matrix.jsx";

const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>,
        children: [
            {
                path: '/',
                element: <Main/>
            },
            {
                path: '/train',
                element: <CreateData/>
            },
            {
                path: '/network',
                element: <NNtrain/>
            },
            {
                path: '/matrix',
                element: <Matrix/>
            }

        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <RouterProvider router={router}/>
  </React.StrictMode>,
)
