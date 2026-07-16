import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#F4F6F2",
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAF7",
  primary: "#2E7D4F",
  primarySoft: "#E7F3EB",
  primaryDark: "#1F5E39",
  text: "#18201B",
  textSoft: "#68736C",
  border: "#E5EAE6",
  danger: "#D94A4A",
  shadow: "#1B2B20",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  profileButton: {
    position: "absolute",
    right: 24,
    bottom: 100, // above the + button
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  container: {
    flex: 1,
    marginTop: 0,
  },
  
  container2: {
    flex: 1,
    paddingHorizontal: 20,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 120,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  simpleEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 2,
  },

  simpleTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSoft,
  },

  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#B5BDB7",
    marginHorizontal: 8,
  },

  cleanButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  storeSelectorIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  storeSelectorContent: {
    flex: 1,
    marginLeft: 11,
  },

  storeSelectorLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: COLORS.textSoft,
    marginBottom: 2,
  },

  storeSelectorText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  listHeading: {
    marginBottom: 7,
    paddingHorizontal: 2,
  },

  listTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  sectionTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    paddingLeft: 12,
    paddingRight: 0,
    backgroundColor: COLORS.surface,
  },

  itemRowBorder: {
    borderBottomWidth: 0.8,
    borderBottomColor: COLORS.border,
  },

  storeLogo: {
    width: 30,
    height: 30,
  },

  storeOptionLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },

  lastItemRow: {
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 8,
  },

  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#B7C0BA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  checkboxCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
    color: COLORS.text,
  },

  completedItemText: {
    color: "#9AA39D",
    textDecorationLine: "line-through",
  },

  deleteButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 20,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 270,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: 21,
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  addButton: {
    position: "absolute",
    right: 22,
    bottom: 25,
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,25,19,0.48)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 34,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9DFDA",
    marginBottom: 21,
  },

  modalHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  modalEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: COLORS.primary,
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSoft,
    marginTop: 10,
    marginBottom: 20,
  },

  inputContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DCE3DE",
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 18,
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 11,
    paddingVertical: 15,
  },

  categoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 12,
  },

  categoryPreviewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSoft,
    marginLeft: 8,
  },

  categoryPreviewText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primaryDark,
    textAlign: "right",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 16,
  },

  saveButtonDisabled: {
    opacity: 0.4,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  centerModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,25,19,0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  storeModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 22,
  },

  storeModalIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  storeModalTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },

  storeModalText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSoft,
    marginTop: 7,
    marginBottom: 18,
  },

  storeOptions: {
    gap: 9,
  },

  storeOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },

  storeOptionSelected: {
    borderColor: "#B7D8C1",
    backgroundColor: COLORS.primarySoft,
  },

  storeOptionRadio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#B7C0BA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  storeOptionRadioSelected: {
    borderColor: COLORS.primary,
  },

  storeOptionRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  storeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  storeOptionTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: "900",
  },
});