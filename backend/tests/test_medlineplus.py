"""
Unit Tests for MedlinePlus XML Web Service Adapter.
Validates safe parsing, tag stripping, and source attribution.
"""

import pytest
from app.adapters.medlineplus_adapter import MedlinePlusAdapter, clean_html


SAMPLE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<nlmSearchResult version="1.0">
  <term>insomnia</term>
  <list>
    <document url="https://medlineplus.gov/insomnia.html">
      <content name="title">Insomnia - National Library of Medicine</content>
      <content name="organizationName">U.S. National Library of Medicine</content>
      <content name="FullSummary">&lt;p&gt;Insomnia is a common sleep disorder. People with insomnia have trouble sleeping.&lt;/p&gt;</content>
    </document>
  </list>
</nlmSearchResult>
"""


def test_clean_html_utility():
    raw = "<p>This is a <b>test</b> &amp; sample &quot;quote&quot;</p>"
    clean = clean_html(raw)
    assert clean == 'This is a test & sample "quote"'


def test_parse_xml_valid():
    adapter = MedlinePlusAdapter()
    results = adapter._parse_xml_response(SAMPLE_XML)
    assert len(results) == 1
    doc = results[0]
    assert doc["title"] == "Insomnia - National Library of Medicine"
    assert doc["url"] == "https://medlineplus.gov/insomnia.html"
    assert doc["organization"] == "U.S. National Library of Medicine"
    assert "common sleep disorder" in doc["summary"]
    assert doc["is_verified"] is True


def test_parse_xml_malformed():
    adapter = MedlinePlusAdapter()
    results = adapter._parse_xml_response("<unclosed>xml")
    assert results == []
