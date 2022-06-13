const fs = require('fs')
const axios = require('axios')

require('dotenv').config()

class Geocode {
  KEY = process.env.GCP_API_KEY
  API = 'https://maps.googleapis.com/maps/api/geocode/json'
  inputDir = './input'
  dealers = []
  sample = []

  constructor () {
  }

  main() {
    this.getDealers()
      .then(() => {
        return this.populateData()
      })
      .then(dealers => console.log(JSON.stringify(dealers, 0, 2)))
      .catch(error => { throw error })
  }

  /* adds latLng to dealers object, skips dealer if there is an error */
  async populateData() {
    let calls = []

    for (let id in this.dealers) {
      let dealer = this.dealers[id]

      if (!dealer.address) continue

      calls.push(
        this.getDataFromAddress(dealer.address, id)
        .then(data => {
          return this.parseMapData(data)
        })
        .then(location => {
          if (!location) return null
          location.name = dealer.name.toUpperCase()
          location.phone = dealer.phone || dealer.phone2
          location.email = dealer.email || dealer.email2
          location.id = id
          //location.id = (Number(id) + 174).toString()

          return location
        })
        .catch((error) => {
          console.log(id, dealer.name, dealer.address)
          throw error
        })
      )
    }

    return await Promise.all(calls)
  }

  async parseMapData(data) {
    let address = [
      this.getAddressComponent(data, 'street_number'),
      this.getAddressComponent(data, 'route') + ',',
      this.getAddressComponent(data, 'postal_code'),
      this.getAddressComponent(data, 'locality'),
    ].join(' ')

    if (!data) return null

    return {
      address,
      lat: data.geometry.location.lat,
      lng: data.geometry.location.lng
    }
  }

  getAddressComponent(data, component) {
    if (!data) return
    let street_number = ""

    try {
      street_number =  data.address_components
        .filter(addr => {
          return this.addressComponentHasType(addr, component)
        })
      street_number = street_number[0]['long_name']
    } catch (error) {
      throw (error, data.address_components)
    } finally {
      return street_number
    }
  }

  addressComponentHasType(addressComponent, type) {
    return addressComponent.types.includes(type)
  }

  async getDataFromAddress(address, id) {
    if (!address) return
    const url = encodeURI(`${this.API}?address=${this.formatSpaces(address)}&key=${this.KEY}`)

    return await axios
      .get(url)
      .then(response => response.data.results[0])
      .catch((error) =>{ throw(error) })
  }

  formatSpaces(str) {
    if (!str) return
    return str
      .split(',').join(' ')
      .split('\n').join(' ')
      .split(' ').join('+')
  }

  getDealers() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.inputDir, (error, files) => {
        if (error) reject(new Error('Issue while looking up input files'))

        for (let file of files) {
          let dealers = require(`${this.inputDir}/${file}`)
          this.dealers.push(...dealers)
        }

        resolve()
      })
    })
  }
}

new Geocode().main()

