// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import "mocha";
import { ConnectionConfig, EventHubConnectionConfig, IotHubConnectionConfig } from "../lib";
import * as chai from "chai";
const should = chai.should();

describe("ConnectionConfig", function () {
  describe("Base", function () {
    it("populates config properties from an Event Hubs connection string", function (done) {
      const config = ConnectionConfig.create("Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak;EntityPath=ep");
      config.should.have.property("host").that.equals("hostname.servicebus.windows.net");
      config.should.have.property("sharedAccessKeyName").that.equals("sakName");
      config.should.have.property("sharedAccessKey").that.equals("sak");
      config.should.have.property("entityPath").that.equals("ep");
      done();
    });

    it("populates path from the path argument if connection string does not have EntityPath", function (done) {
      const config = ConnectionConfig.create("Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak", "abc");
      config.should.have.property("entityPath").that.equals("abc");
      done();
    });

    it("should create a connection config when path is not provided and the connectionstring also does not contain EntityPath", function (done) {
      const connectionString = "Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak";
      const config = ConnectionConfig.create(connectionString);
      should.not.exist(config.entityPath);
      done();
    });

    it("handles arbitrary whitespace around ; and = elements", done => {
      const connectionString = `
        Endpoint = sb://hostname.servicebus.windows.net/;
        SharedAccessKeyName = sakName;
        SharedAccessKey = sak;
        EntityPath = ep;
      `;
      const config = ConnectionConfig.create(connectionString);
      config.should.have.property("host").that.equals("hostname.servicebus.windows.net");
      config.should.have.property("sharedAccessKeyName").that.equals("sakName");
      config.should.have.property("sharedAccessKey").that.equals("sak");
      config.should.have.property("entityPath").that.equals("ep");
      done();
    });

    it("requires a value before an assignment", done => {
      const connectionString = `
        = something;
      `;

      should.throw(() => {
        ConnectionConfig.create(connectionString);
      }, /Connection string malformed/);

      done();
    });

    it("allows an empty value after an assignment", done => {
      const connectionString = `
        Endpoint = sb://hostname.servicebus.windows.net/;
        SharedAccessKey=;
      `;
      const config = ConnectionConfig.create(connectionString);
      config.should.have.property("host").that.equals("hostname.servicebus.windows.net");
      config.should.have.property("sharedAccessKey").that.equals("");
      done();
    });

    it("requires an assignment for each part", done => {
      const connectionString = `
        EntityPath;
      `;

      should.throw(() => {
        ConnectionConfig.create(connectionString);
      }, /Connection string malformed/);
      done();
    });

    it("requires that Endpoint be present in the connection string", done => {
      const connectionString = `
        EntityPath=ep;
      `;

      should.throw(() => {
        ConnectionConfig.create(connectionString);
      }, /missing Endpoint/);

      done();
    });
  });

  describe("EventHub", function () {

    it("should fail if connection config does not contain path and the connectionstring also does not contain EntityPath", function (done) {
      const connectionString = "Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak";
      try {
        EventHubConnectionConfig.create(connectionString);
        done(new Error("Should not have reached here."));
      } catch (err) {
        err.message.should.match(/Either provide "path" or the "connectionString".*/ig);
      }
      done();
    });

    it("should correctly populate config properties from an EventHubs connection string and the helper methods should work as expected", function (done) {
      const config = EventHubConnectionConfig.create("Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak;EntityPath=ep");
      config.should.have.property("host").that.equals("hostname.servicebus.windows.net");
      config.should.have.property("sharedAccessKeyName").that.equals("sakName");
      config.should.have.property("sharedAccessKey").that.equals("sak");
      config.should.have.property("entityPath").that.equals("ep");

      config.getManagementAddress().should.equal("ep/$management");
      config.getSenderAddress().should.equal("ep");
      config.getSenderAddress("0").should.equal("ep/Partitions/0");
      config.getSenderAddress(0).should.equal("ep/Partitions/0");
      config.getReceiverAddress("0").should.equal("ep/ConsumerGroups/$default/Partitions/0");
      config.getReceiverAddress(0).should.equal("ep/ConsumerGroups/$default/Partitions/0");
      config.getReceiverAddress("0", "cg").should.equal("ep/ConsumerGroups/cg/Partitions/0");
      config.getReceiverAddress(0, "cg").should.equal("ep/ConsumerGroups/cg/Partitions/0");

      config.getManagementAudience().should.equal("sb://hostname.servicebus.windows.net/ep/$management");
      config.getSenderAudience().should.equal("sb://hostname.servicebus.windows.net/ep");
      config.getSenderAudience("0").should.equal("sb://hostname.servicebus.windows.net/ep/Partitions/0");
      config.getSenderAudience(0).should.equal("sb://hostname.servicebus.windows.net/ep/Partitions/0");
      config.getReceiverAudience("0").should.equal("sb://hostname.servicebus.windows.net/ep/ConsumerGroups/$default/Partitions/0");
      config.getReceiverAudience(0).should.equal("sb://hostname.servicebus.windows.net/ep/ConsumerGroups/$default/Partitions/0");
      config.getReceiverAudience("0", "cg").should.equal("sb://hostname.servicebus.windows.net/ep/ConsumerGroups/cg/Partitions/0");
      config.getReceiverAudience(0, "cg").should.equal("sb://hostname.servicebus.windows.net/ep/ConsumerGroups/cg/Partitions/0");
      done();
    });

    it("requires that Endpoint be present in the connection string", done => {
      const connectionString = `Endpoint=sb://a`;

      should.throw(() => {
        EventHubConnectionConfig.create(connectionString);
      }, /must contain EntityPath/);

      done();
    });
  });

  describe("IotHub", function () {
    const iotString = "HostName=someiot.azure-devices.net;SharedAccessKeyName=sakName;SharedAccessKey=sak;DeviceId=device-1234";
    it("should correctly create an iothub connection config from an iothub connectionstring", function (done) {
      const config = IotHubConnectionConfig.create(iotString);
      config.should.have.property("hostName").that.equals("someiot.azure-devices.net");
      config.should.have.property("host").that.equals("someiot");
      config.should.have.property("sharedAccessKeyName").that.equals("sakName");
      config.should.have.property("sharedAccessKey").that.equals("sak");
      config.should.have.property("entityPath").that.equals("messages/events");
      done();
    });

    it("populates path from the path argument if provided", function (done) {
      const config = IotHubConnectionConfig.create(iotString, "abc");
      config.should.have.property("entityPath").that.equals("abc");
      done();
    });

    it("converts an IotHubConnectionConfig to an EventHubConnectionConfig", function (done) {
      const config = IotHubConnectionConfig.create(iotString);
      const ehConfig = IotHubConnectionConfig.convertToEventHubConnectionConfig(config);
      ehConfig.should.have.property("endpoint").that.equals("sb://someiot.azure-devices.net/");
      ehConfig.should.have.property("host").that.equals("someiot.azure-devices.net");
      ehConfig.should.have.property("sharedAccessKeyName").that.equals("sakName");
      ehConfig.should.have.property("sharedAccessKey").that.equals("sak");
      ehConfig.should.have.property("entityPath").that.equals("messages/events");

      ehConfig.getManagementAddress().should.equal("messages/events/$management");
      ehConfig.getSenderAddress().should.equal("messages/events");
      ehConfig.getSenderAddress("0").should.equal("messages/events/Partitions/0");
      ehConfig.getSenderAddress(0).should.equal("messages/events/Partitions/0");
      ehConfig.getReceiverAddress("0").should.equal("messages/events/ConsumerGroups/$default/Partitions/0");
      ehConfig.getReceiverAddress(0).should.equal("messages/events/ConsumerGroups/$default/Partitions/0");
      ehConfig.getReceiverAddress("0", "cg").should.equal("messages/events/ConsumerGroups/cg/Partitions/0");
      ehConfig.getReceiverAddress(0, "cg").should.equal("messages/events/ConsumerGroups/cg/Partitions/0");

      ehConfig.getManagementAudience().should.equal("sb://someiot.azure-devices.net/messages/events/$management");
      ehConfig.getSenderAudience().should.equal("sb://someiot.azure-devices.net/messages/events");
      ehConfig.getSenderAudience("0").should.equal("sb://someiot.azure-devices.net/messages/events/Partitions/0");
      ehConfig.getSenderAudience(0).should.equal("sb://someiot.azure-devices.net/messages/events/Partitions/0");
      ehConfig.getReceiverAudience("0").should.equal("sb://someiot.azure-devices.net/messages/events/ConsumerGroups/$default/Partitions/0");
      ehConfig.getReceiverAudience(0).should.equal("sb://someiot.azure-devices.net/messages/events/ConsumerGroups/$default/Partitions/0");
      ehConfig.getReceiverAudience("0", "cg").should.equal("sb://someiot.azure-devices.net/messages/events/ConsumerGroups/cg/Partitions/0");
      ehConfig.getReceiverAudience(0, "cg").should.equal("sb://someiot.azure-devices.net/messages/events/ConsumerGroups/cg/Partitions/0");
      done();
    });
  });
});
