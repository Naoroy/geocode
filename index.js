const fs = require('fs')
const axios = require('axios')
const dealers = require('./input/revendeurs_010422.json')

class geocode {
  KEY = 'AIzaSyCegDsZdHyK1Ea4KCdnjFRlIBkIkcdCiA8'
  API = 'https://maps.googleapis.com/maps/api/geocode/json'

  async main() {
    //let ln = dealers.length
    let ln = 2
    let calls = []
    for (let i = 0; i < ln; i++) {
      let dealer = dealers[i]
      calls.push(
        this.getDataFromAddress(dealer.address)
          .then((data) => this.parseMapData(data))
      )
      //let data = await this.getDataFromAddress(dealer.address)
    }
    let res = await Promise.all(calls)
    console.log(res)
  }

  async parseMapData(data) {
    let d = data[0]
    return {
      street: this.getAddressComponent(data, 'street_number'),
      route: this.getAddressComponent(data, 'route'),
      postal: this.getAddressComponent(data, 'postal_code'),
      locality: this.getAddressComponent(data, 'locality'),
    }
  }

  getAddressComponent(data, component) {
    if (!data) return
    console.log(data)

    let street_number = data.address_components
      .filter(addr => {
        this.addressComponentHasType(addr, component)
      })[0]['long_name']

    return street_number
  }

  addressComponentHasType(addressComponent, type) {
    return addressComponent.types.includes(type)
  }

  async getAllShopsLatLng(shops) {

    let actions = shops.map(async function(shop, i) {
      let address = await this.getAddressData(shop.address)
      try {
        let streetNumber = address.address_components
          .filter(function(addressComponent) {
            return filterAddressComponent(addressComponent, 'street_number')
          })[0]['long_name']

        let route = address.address_components
          .filter(function(addressComponent) {
            return filterAddressComponent(addressComponent, 'route')
          })[0]['long_name']

        let postal = address.address_components
          .filter(function(addressComponent) {
            return filterAddressComponent(addressComponent, 'postal_code')
          })[0]['long_name']

        let city = address.address_components
          .filter(function(addressComponent) {
            return filterAddressComponent(addressComponent, 'locality')
          })[0]['long_name']

        shop.id     = i.toString()
        shop.street = streetNumber + '' + route
        shop.postal = postal
        shop.lat    = address.geometry.location.lat
        shop.lng    = address.geometry.location.lng
        shop.city   = city
        shop.address = `${shop.street}, ${shop.postal}`
      }
      catch (error) {
        console.log(error)
      }
      finally {
        shop = shop.lat ? shop : undefined
      }
      return shop
    })
    let results = await Promise.all(actions)
    return results.filter(x => x)
  }

  async getDataFromAddress(address) {
    if (!address) return
    const url = encodeURI(`${this.API}?address=${this.formatSpaces(address)}&key=${this.KEY}`)

    return await axios.get(url)
      .then(response => {
        return response.data.results[0]
      })
      .catch(function (error) { console.log(error) })
  }

  formatSpaces(str) {
    if (!str) return
    return str.split(' ').join('+')
  }

  getLatLng(address) {

  }
}

new geocode().main()

