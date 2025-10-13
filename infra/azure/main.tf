provider "azurerm" { features = {} }

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "rg" {
  name     = "orionx-rg"
  location = "East US"
}

resource "azurerm_key_vault" "kv" {
  name                        = "orionx-kv"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  sku_name                    = "standard"
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  purge_protection_enabled    = false
  soft_delete_enabled         = true 
}