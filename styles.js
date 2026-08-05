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

  storePresencePrompt: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 222,
    zIndex: 50,
    elevation: 12,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderWidth: 1,
    borderColor: "#BFDCC8",
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  storePresencePromptIcon: {
    width: 36,
    height: 36,
    marginRight: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },

  storePresencePromptCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  storePresencePromptTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  storePresencePromptText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    color: COLORS.textSoft,
  },

  storePresencePromptActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  storePresenceNoButton: {
    minWidth: 38,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#F0F3F1",
  },

  storePresenceNoText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSoft,
  },

  storePresenceYesButton: {
    minWidth: 38,
    height: 34,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  storePresenceYesText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
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

  notePadIcon: {
    position: "absolute",
    right: 36,
    bottom: 168,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  notePadIconActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
    paddingBottom: 210,
  },

  notePadScroll: {
    flex: 1,
  },

  notePadContent: {
    flexGrow: 1,
  },

  notePadDismissArea: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  notePadCard: {
    minHeight: 360,
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#F0C990",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },

  notePadInput: {
    minHeight: 360,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
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

  simpleHeaderCopy: {
    flex: 1,
    marginRight: 8,
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

  simpleHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  offlineIndicator: {
    width: 28,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  cleanButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  clearAllButton: {
    marginLeft: 7,
    backgroundColor: "#FBECEC",
  },

  listTabsBlock: {
    marginBottom: 12,
  },

  listTabsLabel: {
    paddingHorizontal: 2,
    marginBottom: 7,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textSoft,
  },

  listTabsContent: {
    alignItems: "center",
    paddingRight: 22,
  },

  listTabsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  listTabsScroller: {
    flex: 1,
    marginRight: -18,
  },

  listTab: {
    minHeight: 39,
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },

  listTabSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  listTabSelect: {
    minHeight: 37,
    justifyContent: "center",
    paddingLeft: 13,
    paddingRight: 8,
  },

  listTabText: {
    maxWidth: 125,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  listTabTextSelected: {
    color: "#FFFFFF",
  },

  listTabDelete: {
    width: 31,
    minHeight: 37,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },

  addListTab: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#AFCDB8",
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
  },

  addListTabText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    height: 39,
    maxWidth: 125,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 7,
    marginRight: 8,
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
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  storeSelectorText: {
    flexShrink: 1,
    maxWidth: 65,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginRight: 3,
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

  sectionTitleCopy: {
    flex: 1,
    justifyContent: "center",
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
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  unsortedSectionHeader: {
    backgroundColor: "#FFF0DC",
  },

  unsortedSectionIcon: {
    backgroundColor: "#FFE0B5",
  },

  unsortedSectionTitle: {
    color: "#B95700",
  },

  unsortedSectionSubtitle: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.15,
    color: "#D96B0B",
  },

  categoryAssignmentButton: {
    minWidth: 27,
    maxWidth: 112,
    height: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    paddingHorizontal: 7,
    marginLeft: 6,
  },

  categoryAssignmentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  categoryAssignmentName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
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
    width: 23,
    height: 23,
  },

  storeOptionLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },

  storeOptionLogoFallback: {
    width: 28,
    height: 28,
    marginRight: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
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
    maxHeight: "92%",
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 22,
  },

  assignmentModal: {
    maxWidth: 390,
    maxHeight: "84%",
  },

  assignmentHeadingCopy: {
    flex: 1,
    marginRight: 12,
  },

  assignmentDescription: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSoft,
  },

  assignmentPeopleScroll: {
    maxHeight: 285,
    flexShrink: 1,
  },

  assignmentPeopleList: {
    gap: 7,
    paddingBottom: 3,
  },

  assignmentPersonOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSoft,
    paddingHorizontal: 10,
  },

  assignmentPersonAvatar: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  assignmentPersonInitial: {
    fontSize: 14,
    fontWeight: "900",
  },

  assignmentPersonName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },

  assignmentNobodyIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECEFED",
    marginRight: 10,
  },

  assignmentNobodyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSoft,
  },

  assignmentEmptyText: {
    paddingVertical: 15,
    paddingHorizontal: 6,
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
  },

  assignmentCreateLabel: {
    marginTop: 17,
    marginBottom: 7,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.textSoft,
    textTransform: "uppercase",
  },

  assignmentCreateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  assignmentInputContainer: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
  },

  assignmentAddButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginLeft: 9,
  },

  assignmentAddButtonDisabled: {
    opacity: 0.35,
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
    paddingBottom: 2,
  },

  storeOptionsScroll: {
    maxHeight: 465,
    flexShrink: 1,
  },

  storeOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  storeOptionSelected: {
    borderColor: "#B7D8C1",
    backgroundColor: COLORS.primarySoft,
  },

  storeOptionMain: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 13,
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

  customStoreDeleteButton: {
    width: 48,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
  },

  addCustomStoreOption: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#AFCDB8",
    borderRadius: 17,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 13,
  },

  addCustomStoreIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 11,
  },

  addCustomStoreCopy: {
    flex: 1,
  },

  addCustomStoreTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  addCustomStoreText: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSoft,
  },

  customStoreEditor: {
    maxHeight: "92%",
    paddingBottom: 18,
  },

  customStoreHeadingCopy: {
    flex: 1,
    marginRight: 12,
  },

  customStoreDescription: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSoft,
  },

  customStoreEditorScroll: {
    flexShrink: 1,
  },

  customStoreEditorContent: {
    paddingBottom: 3,
  },

  customStoreFieldLabel: {
    marginBottom: 7,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: COLORS.textSoft,
    textTransform: "uppercase",
  },

  customStoreLogoPicker: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#B9D4C1",
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    padding: 11,
    marginBottom: 17,
  },

  customStoreLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },

  customStoreLogoPreview: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },

  customStoreLogoEditBadge: {
    position: "absolute",
    left: 52,
    bottom: 7,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  customStoreLogoPickerText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  customStoreCategoryHeading: {
    marginTop: 20,
  },

  customStoreCategoryHelp: {
    marginTop: -3,
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSoft,
  },

  customStoreCategoryList: {
    gap: 7,
  },

  customStoreCategoryRow: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSoft,
    paddingLeft: 10,
    paddingRight: 6,
  },

  customStoreCategoryNumber: {
    width: 23,
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.textSoft,
    textAlign: "center",
  },

  customStoreCategoryIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    marginHorizontal: 7,
  },

  customStoreCategoryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  customStoreCategoryActions: {
    flexDirection: "row",
    gap: 4,
  },

  customStoreCategoryMove: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  customStoreCategoryMoveDisabled: {
    backgroundColor: "#F1F3F1",
  },

  customStoreSaveButton: {
    marginTop: 13,
  },

  originalItemWhileDragging: {
    opacity: 0.25,
  },

  activeListCategoryHeader: {
    backgroundColor: COLORS.primary,
  },

  activeListCategoryTitle: {
    color: "#FFFFFF",
  },

  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },

  dragBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 18, 0.58)",
  },

  dragPanel: {
    position: "absolute",
    top: 18,
    left: 14,
    right: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  dragTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  dragText: {
    marginTop: 3,
    marginBottom: 12,
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },

  categoryDropTarget: {
    width: "48.5%",
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#DDE6E0",
    borderRadius: 13,
    backgroundColor: "#F8FAF8",
    flexDirection: "row",
    alignItems: "center",
  },

  currentCategoryTarget: {
    borderColor: "#B9C8BF",
  },

  activeCategoryTarget: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    transform: [
      {
        scale: 1.03,
      },
    ],
  },

  categoryTargetIcon: {
    width: 28,
    height: 28,
    marginRight: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryTargetText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  activeCategoryTargetText: {
    color: "#FFFFFF",
  },

  floatingItem: {
    position: "absolute",
    width: 230,
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
  },

  floatingItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

});
