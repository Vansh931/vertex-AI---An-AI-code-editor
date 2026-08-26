import api from "../utils/axios"

export const getMe = async (token) => {
    try {
        const {data}=await api.get("/api/me")
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}